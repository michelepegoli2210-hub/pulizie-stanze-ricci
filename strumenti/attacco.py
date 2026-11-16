# I filmati di Sofia senza scatti · 16/11/2026
# Michele: «mi piace di più come adesso… queste movenze qui… l'unica cosa che non mi piace è che sono dei video separati,
# quindi fa scatti». Qui NON si ridisegna niente: tra la fine di un pezzo (A) e l'inizio del pezzo dopo (B) si aggiungono
# pochi fotogrammi fatti SOLO coi due fotogrammi veri: ogni punto di Sofia scivola dal posto che ha in A al posto che ha
# in B (lo spostamento lo misura il computer, punto per punto) mentre il colore passa piano da A a B.
# Il primo fotogramma aggiunto è quasi A, l'ultimo è quasi B: i pezzi veri restano interi, com'erano.
import numpy as np, cv2

def grigio(bgr):
    return cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

def flusso(a_bgr, b_bgr, modo="deep"):
    """di quanto si sposta ogni punto da A a B (in pixel)"""
    a, b = grigio(a_bgr), grigio(b_bgr)
    if modo == "deep":
        f = cv2.optflow.createOptFlow_DeepFlow().calc(a, b, None)
    elif modo == "tvl1":
        t = cv2.optflow.DualTVL1OpticalFlow_create(); t.setLambda(0.08); t.setScalesNumber(6); t.setWarpingsNumber(6); t.setEpsilon(0.005)
        f = t.calc(a, b, None)
    else:
        d = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
        d.setFinestScale(0); d.setPatchStride(2); d.setGradientDescentIterations(40); d.setVariationalRefinementIterations(10)
        f = d.calc(a, b, None)
    return f.astype(np.float32)

def flusso_a_scale(a_bgr, b_bgr, scale=(4, 2, 1), modo="deep"):
    """lo spostamento da A a B misurato prima «da lontano» (immagine rimpicciolita: i movimenti grossi, come la testa che
    si gira, diventano piccoli e si trovano bene), poi sempre più da vicino, ogni volta solo quello che manca"""
    h, w = a_bgr.shape[:2]; xx, yy = griglia(h, w)
    F = np.zeros((h, w, 2), np.float32)
    for s in scale:
        # B riportata verso A con lo spostamento trovato finora: resta da misurare solo il resto
        bw = cv2.remap(b_bgr, xx + F[..., 0], yy + F[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        if s > 1:
            ka = cv2.resize(a_bgr, (w // s, h // s), interpolation=cv2.INTER_AREA); kb = cv2.resize(bw, (w // s, h // s), interpolation=cv2.INTER_AREA)
            R = cv2.resize(flusso(ka, kb, modo), (w, h), interpolation=cv2.INTER_CUBIC) * s
            R = cv2.GaussianBlur(R, (0, 0), s)
        else:
            R = flusso(a_bgr, bw, modo)
        # F nuovo(y) = R(y) + F(y + R(y))
        F = R + np.dstack([cv2.remap(F[..., c], xx + R[..., 0], yy + R[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) for c in (0, 1)])
    return F

def campiona(img, mx, my):
    return cv2.remap(img, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)

def griglia(h, w):
    xx, yy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return xx, yy

def punto_di_partenza(F, t, giri=12):
    """per ogni punto x del fotogramma di mezzo trova il punto y di A che ci arriva: x = y + t·F(y)"""
    h, w = F.shape[:2]; xx, yy = griglia(h, w)
    yx, yy2 = xx.copy(), yy.copy()
    for _ in range(giri):
        fx = cv2.remap(F[..., 0], yx, yy2, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        fy = cv2.remap(F[..., 1], yx, yy2, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        yx, yy2 = xx - t * fx, yy - t * fy
    fx = cv2.remap(F[..., 0], yx, yy2, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    fy = cv2.remap(F[..., 1], yx, yy2, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    err = np.hypot(yx + t * fx - xx, yy2 + t * fy - yy)
    return yx, yy2, fx, fy, err

def di_mezzo(strati_a, strati_b, F, t, tc=None):
    """il fotogramma a metà strada: t = quanto si è spostata (0 = A, 1 = B), tc = quanto è passato il colore (se manca = t).
    strati_a / strati_b: liste di immagini float32 (anche con la trasparenza già moltiplicata) da trattare allo stesso modo"""
    tc = t if tc is None else tc
    yx, yy, fx, fy, err = punto_di_partenza(F, t)
    out = []
    for A, B in zip(strati_a, strati_b):
        a = campiona(A, yx, yy); b = campiona(B, yx + fx, yy + fy)
        out.append((1 - tc) * a + tc * b)
    return out, err

def dolce(u):
    """parte piano, arriva piano (0..1)"""
    return u * u * u * (u * (u * 6 - 15) + 10)

# ---------- lo spostamento «pulito»: misurato su Sofia ritagliata (senza la sala dietro), controllato nei due versi
def su_grigio(rgba, g=190):
    """Sofia ritagliata appoggiata su un grigio pieno (BGR, uint8): il contorno diventa un segno che si può seguire"""
    a = rgba[..., 3:4].astype(np.float32) / 255
    return np.clip(rgba[..., :3].astype(np.float32) * a + g * (1 - a) + 0.5, 0, 255).astype(np.uint8)

def riempi(F, buono, passi=(2, 4, 8, 16, 32, 64)):
    """dove lo spostamento non è sicuro si prende quello dei punti sicuri vicini (media pesata, sempre più larga)"""
    w = buono.astype(np.float32); out = F.copy(); fatto = buono.copy()
    for s in passi:
        den = cv2.GaussianBlur(w, (0, 0), s)
        num = cv2.GaussianBlur(F * w[..., None], (0, 0), s)
        ok = (den > 0.05) & ~fatto
        out[ok] = num[ok] / den[ok][:, None]; fatto |= ok
    den = cv2.GaussianBlur(w, (0, 0), 128); num = cv2.GaussianBlur(F * w[..., None], (0, 0), 128)
    resto = ~fatto
    out[resto] = num[resto] / np.maximum(den[resto], 1e-6)[:, None]
    return out

def flusso_pulito(a_rgba, b_rgba, modo="deep", soglia=1.5, liscio=2.0, scale=None):
    """spostamento da A a B misurato sui ritagli; i punti dove andata e ritorno non tornano (cose che compaiono o
    spariscono: un braccio che si stacca dal fianco, i denti) prendono lo spostamento dei vicini. Poi una lisciata."""
    A, B = su_grigio(a_rgba), su_grigio(b_rgba)
    if scale: Fab, Fba = flusso_a_scale(A, B, scale, modo), flusso_a_scale(B, A, scale, modo)
    else: Fab, Fba = flusso(A, B, modo), flusso(B, A, modo)
    h, w = Fab.shape[:2]; xx, yy = griglia(h, w)
    rx = cv2.remap(Fba[..., 0], xx + Fab[..., 0], yy + Fab[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    ry = cv2.remap(Fba[..., 1], xx + Fab[..., 0], yy + Fab[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    err = np.hypot(Fab[..., 0] + rx, Fab[..., 1] + ry)
    dentro = (a_rgba[..., 3] > 8)
    buono = (err < soglia) & dentro
    buono = cv2.erode(buono.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    F = riempi(Fab, buono)
    if liscio > 0: F = cv2.GaussianBlur(F, (0, 0), liscio)
    return F, err, buono

def premoltiplica(rgba):
    f = rgba.astype(np.float32); a = f[..., 3:4] / 255
    return np.dstack([f[..., :3] * a, f[..., 3:4]])

def spremoltiplica(p):
    """dal ritaglio premoltiplicato al PNG con la trasparenza, fatto come i fotogrammi veri (s3d/ritaglia.py, decontamina):
    fuori da lei e sui bordi molto trasparenti il colore è quello di lei lì vicino (non il nero): così il bordo, una volta
    compresso nel filmato, resta uguale a quello dei fotogrammi veri"""
    a = np.clip(p[..., 3], 0, 255) / 255
    stim = np.clip(p[..., :3] / np.maximum(a, 0.02)[..., None], 0, 255)
    dentro = (a > 0.98).astype(np.float32); k = (41, 41)
    fgst = cv2.blur(stim * dentro[..., None], k) / (cv2.blur(dentro, k)[..., None] + 1e-4)
    peso = np.clip((a - 0.02) / 0.5, 0, 1)[..., None]
    out = np.where(a[..., None] > 0.995, stim, peso * stim + (1 - peso) * fgst)
    return np.clip(np.dstack([out, a * 255]) + 0.5, 0, 255).astype(np.uint8)

# ---------- il fotogramma di mezzo fatto bene (senza strappi): lo spostamento si «porta» al momento t
def porta_a(F, t, costo):
    """lo spostamento misurato su A, portato dove Sofia si trova al momento t (0..1). Se due punti di A finiscono nello
    stesso posto (una parte passa davanti a un'altra) vince quello che in B si ritrova meglio (costo più basso);
    i posti dove non arriva nessuno (cose che si scoprono) prendono lo spostamento dei vicini."""
    h, w = F.shape[:2]; xx, yy = griglia(h, w)
    px, py = xx + t * F[..., 0], yy + t * F[..., 1]
    x0, y0 = np.floor(px).astype(np.int32), np.floor(py).astype(np.int32)
    out = np.zeros((h * w, 2), np.float32); meglio = np.full(h * w, np.inf, np.float32)
    Ff = F.reshape(-1, 2); c = costo.reshape(-1)
    for dx in (0, 1):
        for dy in (0, 1):
            tx, ty = (x0 + dx).reshape(-1), (y0 + dy).reshape(-1)
            ok = (tx >= 0) & (tx < w) & (ty >= 0) & (ty < h)
            idx = ty[ok] * w + tx[ok]; cc = c[ok]; ff = Ff[ok]
            # il costo più basso per ogni posto di arrivo
            ordine = np.argsort(-cc, kind="stable"); idx, cc, ff = idx[ordine], cc[ordine], ff[ordine]
            tmp_c = np.full(h * w, np.inf, np.float32); tmp_f = np.zeros((h * w, 2), np.float32)
            tmp_c[idx] = cc; tmp_f[idx] = ff          # scritti in ordine: resta l'ultimo, cioè il costo più basso
            vince = tmp_c < meglio
            out[vince] = tmp_f[vince]; meglio[vince] = tmp_c[vince]
    pieno = np.isfinite(meglio).reshape(h, w)
    Ft = riempi(out.reshape(h, w, 2), pieno, passi=(1, 2, 4, 8, 16, 32))
    return cv2.GaussianBlur(Ft, (0, 0), 1.0), pieno

def costo_di(a_img, b_img, F):
    """quanto bene ogni punto di A si ritrova in B dopo lo spostamento (0 = uguale)"""
    h, w = F.shape[:2]; xx, yy = griglia(h, w)
    bw = campiona(b_img.astype(np.float32), xx + F[..., 0], yy + F[..., 1])
    d = np.abs(a_img.astype(np.float32) - bw)
    d = d.reshape(h, w, -1).mean(2)
    return cv2.GaussianBlur(d, (0, 0), 1.5)

def a_meta(strati_a, strati_b, F, costo, t, tc=None):
    """il fotogramma al momento t: A spinta in avanti di t, B tirata indietro di (1-t), mescolate (tc = quanto colore di B)"""
    tc = t if tc is None else tc
    h, w = F.shape[:2]; xx, yy = griglia(h, w)
    if t <= 0: Ft = F
    else: Ft, _ = porta_a(F, t, costo)
    ax, ay = xx - t * Ft[..., 0], yy - t * Ft[..., 1]
    bx, by = xx + (1 - t) * Ft[..., 0], yy + (1 - t) * Ft[..., 1]
    return [(1 - tc) * campiona(A, ax, ay) + tc * campiona(B, bx, by) for A, B in zip(strati_a, strati_b)]

# ---------- il contorno resta netto: dove A e B non combaciano (un braccio che si stacca dal fianco) il bordo SI SPOSTA
#            da quello di A a quello di B, invece di diventare mezzo trasparente
def distanza_dal_bordo(dentro):
    """quanto un punto è dentro (più) o fuori (meno) dalla sagoma, in pixel"""
    d = dentro.astype(np.uint8)
    return cv2.distanceTransform(d, cv2.DIST_L2, 5) - cv2.distanceTransform(1 - d, cv2.DIST_L2, 5)

def pulita(m):
    """la sagoma senza briciole e senza forellini (3 px)"""
    k = np.ones((3, 3), np.uint8); m = m.astype(np.uint8)
    return cv2.morphologyEx(cv2.morphologyEx(m, cv2.MORPH_OPEN, k), cv2.MORPH_CLOSE, k).astype(bool)

def gradino(s, morbido=1.5):
    return np.clip(s / morbido + 0.5, 0, 1)

def due_spostate(pa, pb, F, costo, t):
    """A spinta in avanti di t e B tirata indietro di (1-t), tutte e due nella posa del momento t (premoltiplicate)"""
    h, w = F.shape[:2]; xx, yy = griglia(h, w)
    Ft = F if t <= 0 else porta_a(F, t, costo)[0]
    aw = campiona(pa, xx - t * Ft[..., 0], yy - t * Ft[..., 1])
    bw = campiona(pb, xx + (1 - t) * Ft[..., 0], yy + (1 - t) * Ft[..., 1])
    return aw, bw

def mescola(aw, bw, tc):
    """mescola i due ritagli già spostati (premoltiplicati, 0..255): il colore passa piano, il contorno si sposta netto"""
    mix = (1 - tc) * aw + tc * bw
    al = np.clip(mix[..., 3], 0, 255) / 255
    sa, sb = distanza_dal_bordo(pulita(aw[..., 3] > 127)), distanza_dal_bordo(pulita(bw[..., 3] > 127))
    sa, sb = cv2.GaussianBlur(sa, (0, 0), 2.5), cv2.GaussianBlur(sb, (0, 0), 2.5)      # niente punte nel bordo che si sposta
    netto = gradino((1 - tc) * sa + tc * sb) - ((1 - tc) * gradino(sa) + tc * gradino(sb))
    a_t = np.clip(al + netto, 0, 1)
    rgb = mix[..., :3] / np.maximum(al, 1e-3)[..., None]          # il colore vero (non premoltiplicato) di quello che c'è
    rgb = np.where(al[..., None] > 1e-3, rgb, 0)
    return np.dstack([rgb * a_t[..., None], a_t * 255]).astype(np.float32)

# ---------- la testa prima di tutto: se tra A e B la testa si gira o si inclina tanto (anche 15 gradi), lo spostamento
#            punto per punto da solo si confonde. Prima si trova come si è mossa la testa TUTTA INSIEME (punti riconoscibili:
#            angoli degli occhi, sopracciglia, orecchini, ciocche), poi si misura solo quello che resta (bocca, palpebre…)
TESTA = (120, 90, 430, 440)        # dove sta la testa in questi filmati (540x960)
COLLO = (385, 470)                  # da qui in giù comanda il busto

def mossa_testa(a_rgba, b_rgba, zona=TESTA):
    """la testa da A a B come un pezzo solo: matrice 2x3 (giro, scala, spostamento) oppure None se non si trova"""
    ga, gb = grigio(su_grigio(a_rgba)), grigio(su_grigio(b_rgba))
    x0, y0, x1, y1 = zona
    ma = np.zeros(ga.shape, np.uint8); ma[y0:y1, x0:x1] = 255; ma[a_rgba[..., 3] < 128] = 0
    mb = np.zeros(gb.shape, np.uint8); mb[max(0, y0 - 60):y1 + 60, max(0, x0 - 60):x1 + 60] = 255; mb[b_rgba[..., 3] < 128] = 0
    s = cv2.SIFT_create(nfeatures=4000, contrastThreshold=0.01, edgeThreshold=20)
    ka, da = s.detectAndCompute(ga, ma); kb, db = s.detectAndCompute(gb, mb)
    if da is None or db is None or len(ka) < 8 or len(kb) < 8: return None
    cop = cv2.BFMatcher(cv2.NORM_L2).knnMatch(da, db, k=2)
    buoni = [m[0] for m in cop if len(m) == 2 and m[0].distance < 0.8 * m[1].distance]
    if len(buoni) < 8: return None
    src = np.float32([ka[m.queryIdx].pt for m in buoni]); dst = np.float32([kb[m.trainIdx].pt for m in buoni])
    M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=4.0, maxIters=5000, confidence=0.999)
    if M is None or int(inl.sum()) < 12: return None
    sc = float(np.hypot(M[0, 0], M[1, 0]))
    if not 0.9 < sc < 1.1: return None
    return M.astype(np.float32)

def campo_guida(M, busto, h, w):
    """lo spostamento «grosso»: sopra il collo quello della testa (M), sotto quello del busto (uno spostamento solo)"""
    xx, yy = griglia(h, w)
    if M is None: tx, ty = np.zeros_like(xx), np.zeros_like(yy)
    else: tx, ty = M[0, 0] * xx + M[0, 1] * yy + M[0, 2] - xx, M[1, 0] * xx + M[1, 1] * yy + M[1, 2] - yy
    u = np.clip((yy - COLLO[0]) / (COLLO[1] - COLLO[0]), 0, 1); p = u * u * (3 - 2 * u)      # 0 = testa, 1 = busto
    return np.dstack([(1 - p) * tx + p * busto[0], (1 - p) * ty + p * busto[1]]).astype(np.float32)

def componi(D, R):
    """prima il grosso D poi il resto R (misurato tra A e B già riportata con D): F(y) = R(y) + D(y + R(y))"""
    h, w = D.shape[:2]; xx, yy = griglia(h, w)
    return R + np.dstack([cv2.remap(D[..., c], xx + R[..., 0], yy + R[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE) for c in (0, 1)])

def flusso_con_guida(A, B, D, modo="deep"):
    h, w = A.shape[:2]; xx, yy = griglia(h, w)
    Bw = cv2.remap(B, xx + D[..., 0], yy + D[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return componi(D, flusso(A, Bw, modo))

def flusso_guidato(a_rgba, b_rgba, modo="deep", soglia=1.5, liscio=2.0, dire=None):
    """come flusso_pulito, ma con la testa trovata prima tutta insieme (e il busto con uno spostamento solo)"""
    A, B = su_grigio(a_rgba), su_grigio(b_rgba); h, w = A.shape[:2]; xx, yy = griglia(h, w)
    M = mossa_testa(a_rgba, b_rgba)
    # il busto: primo giro senza guida, lo spostamento più comune (mediana) sotto il collo
    F0 = flusso(A, B, modo); sotto = (a_rgba[..., 3] > 200); sotto[:COLLO[1]] = False; sotto[800:] = False
    busto = (float(np.median(F0[..., 0][sotto])), float(np.median(F0[..., 1][sotto]))) if sotto.any() else (0.0, 0.0)
    Dab = campo_guida(M, busto, h, w)
    Mi = None if M is None else cv2.invertAffineTransform(M)
    Dba = campo_guida(Mi, (-busto[0], -busto[1]), h, w)
    Fab, Fba = flusso_con_guida(A, B, Dab, modo), flusso_con_guida(B, A, Dba, modo)
    rx = cv2.remap(Fba[..., 0], xx + Fab[..., 0], yy + Fab[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    ry = cv2.remap(Fba[..., 1], xx + Fab[..., 0], yy + Fab[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    err = np.hypot(Fab[..., 0] + rx, Fab[..., 1] + ry)
    dentro = (a_rgba[..., 3] > 8)
    buono = cv2.erode(((err < soglia) & dentro).astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
    # dove non è sicuro si torna alla guida (la testa tutta insieme) più il resto dei vicini sicuri: non «a caso»
    R = riempi(Fab - Dab, buono)
    if liscio > 0: R = cv2.GaussianBlur(R, (0, 0), liscio)       # si liscia solo «il resto»: la guida è già liscia
    F = Dab + R
    if dire is not None:
        if M is None: dire.append("testa: non trovata (si va senza guida)")
        else: dire.append("testa: giro %.1f gradi, spostamento (%.1f, %.1f)" % (np.degrees(np.arctan2(M[1, 0], M[0, 0])), M[0, 0] * 270 + M[0, 1] * 280 + M[0, 2] - 270, M[1, 0] * 270 + M[1, 1] * 280 + M[1, 2] - 280))
        dire.append("busto: spostamento (%.1f, %.1f)" % busto)
    return F, err, buono


# ---------- la versione che tiene i colori dei bordi ESATTAMENTE come nei fotogrammi veri: si lavora col colore «pieno»
#            (quello del PNG, che fuori da lei continua coi suoi colori) e con la trasparenza a parte
def mescola_piena(sa, sb, tc):
    """sa, sb: i due ritagli già spostati, RGBA «pieni» (non premoltiplicati), float 0..255. Torna RGBA pieno, float.
    Il colore passa piano da A a B (dove una delle due non c'è vale l'altra); il contorno si sposta netto (come mescola)."""
    aa, ab = np.clip(sa[..., 3], 0, 255) / 255, np.clip(sb[..., 3], 0, 255) / 255
    wa, wb = (1 - tc) * aa, tc * ab; den = wa + wb
    dentro = (wa[..., None] * sa[..., :3] + wb[..., None] * sb[..., :3]) / np.maximum(den, 1e-3)[..., None]
    fuori = (1 - tc) * sa[..., :3] + tc * sb[..., :3]
    m = np.clip(den / 0.02, 0, 1)[..., None]
    col = m * dentro + (1 - m) * fuori
    da, db = distanza_dal_bordo(pulita(aa > 0.5)), distanza_dal_bordo(pulita(ab > 0.5))
    da, db = cv2.GaussianBlur(da, (0, 0), 2.5), cv2.GaussianBlur(db, (0, 0), 2.5)
    netto = gradino((1 - tc) * da + tc * db) - ((1 - tc) * gradino(da) + tc * gradino(db))
    a_t = np.clip(den + netto, 0, 1)
    return np.dstack([np.clip(col, 0, 255), a_t * 255]).astype(np.float32)

def a_png(piena):
    return np.clip(piena + 0.5, 0, 255).astype(np.uint8)
