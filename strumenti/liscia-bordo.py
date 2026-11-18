# I LAMPI NEL RITAGLIO (17/11/2026 sera, per la 1.95.0). Michele: «trema leggermente quando c'è il video che si mette i capelli
# dietro l'orecchio… lagga nei capelli un pochettino… si toglie le immagini».
# Il ritaglio (la sagoma di Sofia senza la sala) è fatto fotogramma per fotogramma, ognuno per conto suo, e ogni tanto sbaglia:
# per uno, due o tre fotogrammi si apre un BUCO dentro di lei e lì si vede il fondo: un lampo chiaro. Nel video dei capelli
# accanto alla guancia mentre porta la mano all'orecchio (fotogrammi 70 e 71, 2500 puntini); nel video del bacio tra le dita
# (30-32), tra il pollice e il palmo e sulla spalla (58-60, 63), sul petto (128-131, fino a 5000 puntini).
# COSA FA: chiude i buchi SBAGLIATI DI SICURO, e solo quelli. Un buco è un pezzo trasparente tutto circondato da lei. Si chiude se
#   1) è grosso (almeno GROSSO puntini),
#   2) è breve: dura meno di DURATA fotogrammi di fila (un'apertura vera, il braccio piegato, dura). «Dura» vuol dire che nel
#      fotogramma vicino c'è un buco che copre almeno il 30% DI QUESTO: prima bastava il 30% del più piccolo dei due, e un
#      buchino da niente il fotogramma prima faceva sembrare «vero» il buco sul petto, che restava aperto al 129 mentre al 130
#      e al 131 si chiudeva: un lampo solo, peggio di prima,
#   3) sta in un posto dove la sala NON SI VEDE MAI in tutto il video (lì c'è sempre lei: la guancia, il petto, la mano davanti
#      alla giacca). La sala si impara dai fotogrammi: il colore di ogni puntino quando è «fuori» davvero (il trasparente che
#      arriva al bordo dell'immagine). Dove invece la sala ogni tanto si vede non si tocca niente: la pelle e la sala sono
#      tutte e due chiare e il colore non basta a decidere (lo spicchio tra il braccio e il fianco mentre il braccio sale in
#      fretta, la ciocca chiara sul bordo dei capelli: chiusi un fotogramma sì e uno no erano un tremolio NUOVO).
#   Poi i RESTI: lo stesso buco, il fotogramma prima o dopo, è spesso più piccolo o solo velato; se sta sopra a un buco appena
#   chiuso (nei due fotogrammi vicini), è breve e sta dove la sala non si vede mai, si chiude anche lui.
# Dentro il buco chiuso si vede lei (il video vero); i colori del bordo si rifanno per tutto il fotogramma con la sagoma nuova
# (decontamina: rifatti con la sagoma di prima vengono uguali a prima, 100 puntini su 300000). I fotogrammi che non cambiano
# restano LO STESSO FILE: nel filmato della 1.95.0 cambiano 13 fotogrammi su 891.
# COME SI CONTROLLA: conta-lampi.py (i puntini che spariscono o compaiono per uno o due fotogrammi mentre l'immagine lì resta
# uguale: il bacio da 899 a 31, i capelli da 1003 a 62, e nessun lampo nuovo) e striscia.py (il video, la sagoma di prima e
# quella nuova uno accanto all'altro, fotogramma per fotogramma: guardarli TUTTI, quelli toccati e i loro vicini).
# PROVATO E SCARTATO (non rifarlo senza un motivo nuovo):
#  - «mettere d'accordo» la sagoma coi due fotogrammi prima e i due dopo (la trasparenza di mezzo, seguendo il movimento:
#    CON_MEDIANA=1). Toglie appena il 7% del tremolio del contorno, che per la gran parte è movimento vero (la testa si piega,
#    i capelli ondeggiano), rifà tutti i fotogrammi, e dove una mano corre taglia il bordo sfumato a scalini (visto sulla mano
#    del bacio e sulla manica). Anche lasciando stare le zone che corrono (PASSO, CORRE) non vale la pena;
#  - chiudere i buchini tra i riccioli (2-7 puntini, un fotogramma, una sessantina per video): chiusi fanno vedere dei puntini
#    della sala in mezzo ai capelli. Restano com'erano. Se Michele vede ancora un luccichio nei capelli, il passo dopo è
#    tenerli sempre APERTI dove lì si vede la sala, non chiuderli.
#   python3 -I strumenti/liscia-bordo.py <cartella dei ritagliati> <cartella dei piatti (con la sala)> <uscita>
import sys, os, numpy as np, cv2, importlib.util
spec = importlib.util.spec_from_file_location('rit', '/home/claude/dev/s3d/ritaglia.py'); rit = importlib.util.module_from_spec(spec); spec.loader.exec_module(rit)
SRC, PIATTI, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
GROSSO = 150        # puntini: sotto è un buchino tra i riccioli e si lascia stare (a meno che sia il resto di un buco chiuso)
DURATA = 4          # fotogrammi di fila: un buco che dura meno è breve
SENZA_MEDIANA = os.environ.get('CON_MEDIANA') != '1'
RAGGIO = 2          # (solo con CON_MEDIANA=1) fotogrammi prima e dopo
UGUALE = 14.0       # (solo con CON_MEDIANA=1) livelli: sotto, nei due fotogrammi si vede la stessa cosa
CORRE = 10.0        # (solo con CON_MEDIANA=1) livelli, a quadretti da 8 puntini: sopra, lì l'immagine sta cambiando in fretta
PASSO = 3.0         # (solo con CON_MEDIANA=1) puntini a fotogramma: sopra, lì si muove in fretta
n = len([x for x in os.listdir(SRC) if x.endswith('.png')])
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
def leggi(i):
    r = cv2.imread(f'{SRC}/f{i:04d}.png', cv2.IMREAD_UNCHANGED); p = cv2.imread(f'{PIATTI}/f{i:04d}.png', cv2.IMREAD_COLOR)
    return r, p, cv2.cvtColor(p, cv2.COLOR_BGR2GRAY), cv2.GaussianBlur(p, (0, 0), 1.2).astype(np.float32), r[..., 3].astype(np.float32) / 255
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
tutti = {}
def prendi(i):
    if i not in tutti: tutti[i] = leggi(i)
    return tutti[i]
H, W = prendi(0)[4].shape; xx, yy = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
def grosso(pm): return cv2.resize(pm, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
fermi_tot = 0.0
cambiati = 0; quanto = []
NUOVI = []; PRIMA = []
for t in range(n):
    r, p, g, pm, a = prendi(t)
    if SENZA_MEDIANA:
        NUOVI.append(a); PRIMA.append(a)
        for k in [k for k in tutti if k < t]: del tutti[k]
        continue
    campioni = [a]; validi = [np.ones_like(a, bool)]; veloce = np.zeros((H, W), bool)
    for s in range(t - RAGGIO, t + RAGGIO + 1):
        if s == t or s < 0 or s >= n: continue
        rs, ps, gs, pms, as_ = prendi(s)
        F = dis.calc(g, gs, None)
        if abs(s - t) == 1:
            veloce |= np.linalg.norm(F, axis=2) > PASSO
            veloce |= cv2.resize(np.abs(grosso(pms) - grosso(pm)).mean(axis=2), (W, H), interpolation=cv2.INTER_NEAREST) > CORRE
        mx, my = xx + F[..., 0], yy + F[..., 1]
        aw = cv2.remap(as_, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        pw = cv2.remap(pms, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        stessa = np.abs(pw - pm).mean(axis=2) < UGUALE
        campioni.append(aw); validi.append(stessa)
    C = np.stack(campioni); V = np.stack(validi)
    quanti = V.sum(axis=0)
    Cm = np.where(V, C, np.nan)
    med = np.nanmedian(Cm, axis=0).astype(np.float32)
    nuovo = np.where(quanti >= 3, med, a)
    # dove corre (e 12 puntini attorno) resta com'era; il passaggio è morbido
    peso = 1 - np.clip(cv2.GaussianBlur(cv2.dilate(veloce.astype(np.uint8), np.ones((25, 25), np.uint8)).astype(np.float32), (0, 0), 5), 0, 1)
    if SENZA_MEDIANA: peso[:] = 0
    fermi_tot += float(peso.mean())
    nuovo = a + peso * (nuovo - a)
    # non si tocca dove è già d'accordo (meno di 4 centesimi): la sagoma ferma resta identica
    nuovo = np.where(np.abs(nuovo - a) < 0.04, a, nuovo).astype(np.float32)
    NUOVI.append(nuovo); PRIMA.append(a)
    for k in [k for k in tutti if k < t - RAGGIO]: del tutti[k]
    if t % 40 == 0: print(t, flush=True)
tutti.clear()
# --- i buchi chiusi dentro la sagoma
def buchi(a):
    """i pezzi trasparenti (da 12 puntini in su) tutti circondati da lei: [(x, y, w, h, maschera ritagliata, area)]. A due soglie:
    «quasi trasparente» (meno di 0,5: un buco vero, anche se col bordo sfumato tocca il contorno di fuori) e «un po' trasparente»
    (meno di 0,9: una macchia velata in mezzo a lei)."""
    out = []
    for soglia in (0.5, 0.9):
        nn, lab, st, cen = cv2.connectedComponentsWithStats((a < soglia).astype(np.uint8), connectivity=4)
        for j in range(1, nn):
            x, y, w, h, area = [int(v) for v in st[j]]
            if area < 12 or x == 0 or y == 0 or x + w >= a.shape[1] or y + h >= a.shape[0]: continue
            out.append((x, y, w, h, (lab[y:y + h, x:x + w] == j).copy(), area))
    return out
def intera(b):
    x, y, w, h, m, area = b; M = np.zeros((H, W), bool); M[y:y + h, x:x + w] = m; return M
def sopra(b1, b2):
    """quanti puntini hanno in comune due buchi"""
    x1, y1, w1, h1, m1, _ = b1; x2, y2, w2, h2, m2, _ = b2
    xa, ya, xb, yb = max(x1, x2), max(y1, y2), min(x1 + w1, x2 + w2), min(y1 + h1, y2 + h2)
    if xb <= xa or yb <= ya: return 0
    return int((m1[ya - y1:yb - y1, xa - x1:xb - x1] & m2[ya - y2:yb - y2, xa - x2:xb - x2]).sum())
B = [buchi(a) + buchi(a0) for a, a0 in zip(NUOVI, PRIMA)]   # nella sagoma nuova e in quella di prima
# la sala senza di lei: per ogni puntino, il colore medio nei fotogrammi in cui lì c'è solo la sala. Conta solo il «fuori» vero
# (il trasparente che arriva al bordo dell'immagine, due puntini dentro): i buchi chiusi dentro di lei no, se no un buco
# sbagliato si scambierebbe per la sala. Tutti i fotogrammi, e bastano 3: prima (uno ogni tre, 6 puntini dentro, almeno 4) uno
# spicchio stretto di sala tra il braccio e il fianco non era mai «conosciuto», e mentre il braccio sale in fretta (capelli,
# fotogramma 67) quell'apertura vera veniva chiusa: una toppa color sala accanto al pugno, per un fotogramma. Visto.
somma = np.zeros((H, W, 3), np.float64); conta = np.zeros((H, W), np.int32); PIANI = []
for t in range(n):
    r, p, g, pm, a = leggi(t)
    tr = (NUOVI[t] < 0.02).astype(np.uint8)
    nn, lab = cv2.connectedComponents(tr, connectivity=4)
    bordo = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])); bordo = bordo[bordo > 0]
    fuori = cv2.erode(np.isin(lab, bordo).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    PIANI.append(p); somma += np.where(fuori[..., None], p, 0); conta += fuori
SALA_IMG = (somma / np.maximum(conta, 1)[..., None]).astype(np.float32); SALA_C_E = conta >= 3
del somma
print(f"   la sala si vede (da sola) nel {100 * SALA_C_E.mean():.0f}% dei puntini; la sagoma si mette d'accordo nel {100 * fermi_tot / n:.0f}% dell'immagine (il resto corre)", flush=True)
chiusi = tenuti = veri = 0; uguali = 0
def dura(t, b):
    """in quanti fotogrammi di fila (attorno a t) c'è un buco chiuso sopra a questo (anche più piccolo: un'apertura vera che si
    stringe e si allarga attorno alla misura GROSSO non deve sembrare «breve»)"""
    def c_e(s):
        if s < 0 or s >= n: return False
        return any(sopra(b, b2) >= 0.3 * b[5] for b2 in B[s])
    k = 1; s = t - 1
    while c_e(s) and k < DURATA + 2: k += 1; s -= 1
    s = t + 1
    while c_e(s) and k < DURATA + 2: k += 1; s += 1
    return k
CHIUDI = []
for t in range(n):
    da_chiudere = np.zeros((H, W), bool)
    for b in B[t]:
        area = b[5]
        if area < GROSSO: continue
        if dura(t, b) >= DURATA: tenuti += 1; continue
        m = intera(b)
        p = PIANI[t].astype(np.float32); nota = m & SALA_C_E
        # SI CHIUDE SOLO IL SICURO: un buco breve in un posto dove la sala non si vede MAI in tutto il video (lì c'è sempre lei:
        # la guancia, il petto, la mano davanti alla giacca) è di sicuro uno sbaglio. Dove invece la sala ogni tanto si vede
        # (almeno un quarto del buco) non si tocca: la pelle e la sala sono tutte e due chiare e il colore non basta a
        # decidere (provato: lo spicchio tra il braccio e il fianco e la ciocca chiara sul bordo dei capelli venivano chiusi
        # un fotogramma sì e uno no, cioè un tremolio nuovo).
        e_sala = nota.sum() >= 0.25 * m.sum()
        dist = float(np.median(np.abs(p[nota] - SALA_IMG[nota]).mean(axis=1))) if nota.any() else -1
        dove = f"a ({b[0] + b[2] // 2}, {b[1] + b[3] // 2}), sala conosciuta nel {100 * nota.sum() / m.sum():.0f}%, distanza dalla sala {dist:.0f}"
        if e_sala: veri += 1; print(f"   lì la sala ogni tanto si vede (non è sicuro che sia uno sbaglio): fotogramma {t}, {area} puntini {dove}: resta", flush=True); continue
        da_chiudere |= m; chiusi += 1; print(f"   buco sbagliato: fotogramma {t}, {area} puntini {dove}: chiuso", flush=True)
    CHIUDI.append(da_chiudere)
# I RESTI: lo stesso buco sbagliato, il fotogramma prima o dopo, è spesso più piccolo di GROSSO o solo velato, e restava lì (nel
# bacio, tra l'indice e il colletto: piccolo al 30, grosso al 31, velato al 32: chiuso solo il 31, restava un guizzo). Un buco
# breve, in un posto dove la sala non si vede mai, che sta sopra a un buco appena chiuso nei due fotogrammi vicini, si chiude.
resti = 0; PRIMO_GIRO = [c.copy() for c in CHIUDI]
for t in range(n):
    vicini_chiusi = np.zeros((H, W), bool)
    for s_ in range(max(0, t - 2), min(n, t + 3)):
        if s_ != t: vicini_chiusi |= PRIMO_GIRO[s_]
    if not vicini_chiusi.any(): continue
    for b in B[t]:
        m = intera(b)
        if (m & CHIUDI[t]).sum() >= 0.5 * b[5]: continue                       # già chiuso
        if (m & vicini_chiusi).sum() < 0.3 * b[5]: continue                     # non è lo stesso buco
        if (m & SALA_C_E).sum() >= 0.25 * b[5] or dura(t, b) >= DURATA: continue
        CHIUDI[t] |= m; resti += 1; print(f"   il resto di un buco chiuso accanto: fotogramma {t}, {b[5]} puntini a ({b[0] + b[2] // 2}, {b[1] + b[3] // 2}): chiuso", flush=True)
del PIANI
for t in range(n):
    r, p, g, pm, a = leggi(t)
    nuovo = NUOVI[t]
    if CHIUDI[t].any():
        # il buco e il suo bordino sfumato (3 puntini attorno), ma solo dove lì attorno è già quasi tutta lei
        m = cv2.dilate(CHIUDI[t].astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
        nuovo = np.where(CHIUDI[t] | (m & (nuovo > 0.3)), 1.0, nuovo).astype(np.float32)
        # i pezzetti rimasti lì accanto (la sagoma di mezzo l'aveva chiuso solo a metà): i buchini chiusi a meno di 12 puntini
        vicino = cv2.dilate(CHIUDI[t].astype(np.uint8), np.ones((25, 25), np.uint8)) > 0
        for soglia in (0.5, 0.97):
            nn, lab, st, cen = cv2.connectedComponentsWithStats((nuovo < soglia).astype(np.uint8), connectivity=4)
            for j in range(1, nn):
                x, y, w, h, area = st[j]
                if x == 0 or y == 0 or x + w >= W or y + h >= H or area >= 4000: continue
                mj = lab == j
                if (mj & vicino).any(): nuovo[mj] = 1.0
    d = np.abs(nuovo - a); cambiati += int((d > 0.25).sum()); quanto.append(float(d.mean()))
    if float(d.max()) < 0.02:
        os.link(f'{SRC}/f{t:04d}.png', f'{OUT}/f{t:04d}.png'); uguali += 1; continue      # niente da cambiare: lo stesso file di prima
    # i colori del bordo si rifanno per tutto il fotogramma con la sagoma nuova (non puntino per puntino: mescolare i colori
    # di prima e quelli nuovi lungo il contorno lo faceva venire «a puntini»: provato)
    rgb = rit.decontamina(cv2.cvtColor(p, cv2.COLOR_BGR2RGB), nuovo)
    cv2.imwrite(f'{OUT}/f{t:04d}.png', cv2.cvtColor(np.dstack([rgb, (nuovo * 255 + 0.5).astype(np.uint8)]), cv2.COLOR_RGBA2BGRA))
print(f"   buchi sbagliati chiusi: {chiusi} (più {resti} resti); lasciati: {tenuti} che durano, {veri} brevi ma dove la sala si vede; fotogrammi rimasti identici: {uguali}", flush=True)
print(f"FATTO {OUT}: {n} fotogrammi; puntini cambiati di molto {cambiati}; cambio medio {np.mean(quanto):.4f}, massimo {np.max(quanto):.4f} (a {int(np.argmax(quanto))})", flush=True)
