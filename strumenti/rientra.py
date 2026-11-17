# «RIENTRO LENTO» (17/11/2026, per la 1.93.0).
# I video nuovi (Flow) partono dalla posa della foto ma alla fine non ci tornano proprio uguali: restano qualche puntino più in là
# (il busto 3-6 puntini di lato, la testa girata di un grado o due). Attaccare lì un altro video voleva dire far «scivolare» Sofia
# tutta insieme per mezzo secondo: proprio la mossa «da robot» che Michele non vuole.
# Qui la correzione si fa UN PO' ALLA VOLTA e MENTRE LEI SI STA ANCORA MUOVENDO (quando rigira la testa, quando abbassa il braccio):
# ogni fotogramma vero della coda viene spostato di pochissimo (meno di mezzo puntino in più a ogni fotogramma), finché l'ultimo
# coincide con il fotogramma da cui parte il video seguente. I fotogrammi restano i suoi, con tutti i suoi piccoli movimenti veri:
# cambia solo dove sta, e così piano che non si vede. Insieme, e allo stesso passo, si porta anche il colore (pochi livelli) a quello
# del video seguente, e nel filmato con la sala lo sfondo (solo le differenze grosse e morbide, non i luccichii).
#   python3 -I rientra.py <video> <ultimo fotogramma> <video seguente> <suo fotogramma> <da> <a> <nome>
#     da..a = i fotogrammi in cui la correzione cresce (da 0 a tutta); da «a» fino all'ultimo resta tutta.
# Esce: oro/<nome>/f%04d.png (ritagliata), oro/<nome>-piatto/f%04d.png (con la sala), oro/<nome>-rientro.json
import sys, os, json, time, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import attacco as at   # attacco.py sta qui accanto
B = '/home/claude/dev/flow1930'
SORG = {'s': '/home/claude/dev/spilla2/saluto-oro', 'f': B + '/oro/ferma', 'k': B + '/oro/capelli', 'l': B + '/oro/lato'}
LISCIO = 8.0     # la correzione è solo «il grosso» (busto, testa, spalle): le cose piccole (bocca, palpebre) non si toccano

def percorso(k, i, piatto=False): return f"{SORG[k]}{'-piatto' if piatto else ''}/f{i:04d}.png"
def leggi(k, i, piatto=False): return cv2.imread(percorso(k, i, piatto), cv2.IMREAD_UNCHANGED)
def sfondo_pulito(piatto, alfa):
    m = cv2.dilate((alfa > 2).astype(np.uint8), np.ones((9, 9), np.uint8))
    return cv2.inpaint(piatto, m * 255, 6, cv2.INPAINT_TELEA).astype(np.float32)
def taglia(x): x[..., 3] = np.clip(x[..., 3], 0, 255); return np.clip(x, 0, 255)
def misura(A, Bf, dire=None):
    F, err, buono = at.flusso_guidato(A, Bf, liscio=3.0, dire=dire)
    dentro = A[..., 3] > 128; dentro[820:] = False
    m = np.hypot(F[..., 0], F[..., 1]); h, w = F.shape[:2]; xx, yy = at.griglia(h, w)
    Bw = at.campiona(Bf.astype(np.float32), xx + F[..., 0], yy + F[..., 1])
    col = float(np.abs(Bw[..., :3] - A[..., :3].astype(np.float32))[A[..., 3] > 200].mean())
    return F, float(m[dentro].mean()), float(np.percentile(m[dentro], 95)), col

X, i, Y, j, da, a, nome = sys.argv[1], int(sys.argv[2]), sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), int(sys.argv[6]), sys.argv[7]
assert 0 <= da < a <= i
t0 = time.time()
A, Bf = leggi(X, i), leggi(Y, j); h, w = A.shape[:2]; xx, yy = at.griglia(h, w)
dire = []
F, medio, p95, col = misura(A, Bf, dire)
print(f"{X}{i} -> {Y}{j}: prima spostamento medio {medio:.1f}, 95% {p95:.1f} px; colore {col:.1f}; {dire}", flush=True)
Fl = cv2.GaussianBlur(F, (0, 0), LISCIO)
costo = at.costo_di(at.premoltiplica(A), at.premoltiplica(Bf), Fl)
campi = {}
def campo(p):
    p = round(float(p), 3)
    if p not in campi:
        if len(campi) > 6: campi.pop(next(iter(campi)))
        campi[p] = at.porta_a(Fl, p, costo)[0]
    return campi[p]
F1 = campo(1.0); campi_fisso = F1
def sposta(img, p):
    Fp = campi_fisso if p >= 0.999 else campo(p)
    mx, my = xx - p * Fp[..., 0], yy - p * Fp[..., 1]
    return at.campiona(img, mx, my), mx, my

# --- il colore: dopo aver riportato A sopra B, la differenza morbida di colore dentro di lei (senza bocca e occhi, che cambiano)
A1, _, _ = sposta(A.astype(np.float32), 1.0)
d = Bf[..., :3].astype(np.float32) - A1[..., :3]
m = ((A1[..., 3] > 250) & (Bf[..., 3] > 250)).astype(np.uint8); m = cv2.erode(m, np.ones((9, 9), np.uint8)).astype(np.float32)
m *= (np.abs(d).max(axis=2) < 28)
def morbido(s):
    n = cv2.GaussianBlur(d * m[..., None], (0, 0), s); p = cv2.GaussianBlur(m, (0, 0), s)
    return n / np.maximum(p, 1e-4)[..., None], p
C25, p25 = morbido(25.0); C90, p90 = morbido(90.0)
u = np.clip(p25 / 0.15, 0, 1)[..., None]
C = np.clip(u * C25 + (1 - u) * C90, -8, 8).astype(np.float32)
zone = dict(viso=(slice(170, 380), slice(190, 370)), giacca=(slice(600, 800), slice(170, 400)), capelli=(slice(380, 560), slice(110, 190)))
print("   colore (B meno A, blu-verde-rosso): " + '; '.join(f"{n} {' '.join('%+.1f' % x for x in C[z].reshape(-1, 3).mean(0))}" for n, z in zone.items()), flush=True)
# --- lo sfondo (filmato con la sala): la differenza morbida tra lo sfondo pulito di B e quello di A
bgA = sfondo_pulito(leggi(X, i, True), A[..., 3]); bgB = sfondo_pulito(leggi(Y, j, True), Bf[..., 3])
Dbg = cv2.GaussianBlur(bgB - bgA, (0, 0), 10.0)
print(f"   sfondo: differenza media {np.abs(bgB - bgA).mean():.1f}, di cui morbida {np.abs(Dbg).mean():.1f}", flush=True)

for dd in (f'{B}/oro/{nome}', f'{B}/oro/{nome}-piatto'):
    os.makedirs(dd, exist_ok=True)
    for f in os.listdir(dd): os.remove(os.path.join(dd, f))
pesi = []
for t in range(i + 1):
    p = 0.0 if t <= da else float(at.dolce(min(1.0, (t - da) / (a - da))))
    pesi.append(round(p, 4))
    if p <= 0:
        for piatto in (False, True): os.link(percorso(X, t, piatto), f"{B}/oro/{nome}{'-piatto' if piatto else ''}/f{t:04d}.png")
        continue
    Xt = leggi(X, t); Pt = leggi(X, t, True).astype(np.float32)
    fg, mx, my = sposta(Xt.astype(np.float32), p)
    fg[..., :3] += p * C
    fg = taglia(fg)
    pm = at.premoltiplica(Xt); bg = sfondo_pulito(Pt.astype(np.uint8), Xt[..., 3])
    res = Pt - (pm[..., :3] + (1 - pm[..., 3:4] / 255) * bg)
    al = fg[..., 3:4] / 255
    piatto = fg[..., :3] * al + (1 - al) * (bg + p * Dbg) + at.campiona(res, mx, my)
    cv2.imwrite(f'{B}/oro/{nome}/f{t:04d}.png', at.a_png(fg))
    cv2.imwrite(f'{B}/oro/{nome}-piatto/f{t:04d}.png', np.clip(piatto + 0.5, 0, 255).astype(np.uint8))
    if t % 20 == 0: print(f"   {t} (peso {p:.2f}) [{time.time() - t0:.0f} s]", flush=True)
# --- controllo: l'ultimo fotogramma nuovo contro quello da cui parte il video seguente
N = cv2.imread(f'{B}/oro/{nome}/f{i:04d}.png', cv2.IMREAD_UNCHANGED)
dire2 = []
_, medio2, p952, col2 = misura(N, Bf, dire2)
print(f"{nome}{i} -> {Y}{j}: dopo spostamento medio {medio2:.1f}, 95% {p952:.1f} px; colore {col2:.1f}; {dire2}", flush=True)
json.dump(dict(video=X, ultimo=i, seguente=Y, suo=j, da=da, a=a, prima=dict(medio=round(medio, 2), p95=round(p95, 2), colore=round(col, 2)),
               dopo=dict(medio=round(medio2, 2), p95=round(p952, 2), colore=round(col2, 2)), pesi=pesi), open(f'{B}/oro/{nome}-rientro.json', 'w'))
print(f"FATTO {nome}: {i + 1} fotogrammi [{time.time() - t0:.0f} s]", flush=True)
