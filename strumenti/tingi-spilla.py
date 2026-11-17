# LA SPILLA D'ORO NEI VIDEO DI GEMINI. Nella foto la spilla (il simbolo delle Stanze di Ricci) è d'oro; nei video che Gemini fa da
# quella foto diventa chiara, quasi bianca, e nei pezzi di una volta (dove l'ho messa io) è dorata: messi in fila si vede il cambio.
# Qui la spilla del video NON si ridisegna: i suoi puntini (chiari, quasi senza colore, in mezzo al blu della giacca) si tingono
# d'oro lì dove sono. Così resta la sua forma, il suo posto, e se una mano le passa davanti resta dietro la mano (la pelle non si tocca).
#   python3 -I tingi_spilla.py <cartella ritagliati> <cartella piatti> <quanti> <x> <y> <cartella di uscita ritagliati> <cartella di uscita piatti>
# (x, y: dove sta la spilla nel primo fotogramma, in puntini 540x960)
import sys, os, json, numpy as np, cv2
cart, cartp, n, x0, y0, out, outp = sys.argv[1], sys.argv[2], int(sys.argv[3]), float(sys.argv[4]), float(sys.argv[5]), sys.argv[6], sys.argv[7]
os.makedirs(out, exist_ok=True); os.makedirs(outp, exist_ok=True)
R = 44        # mezza finestra dove si cerca
RX, RY = 34, 20   # quanto può stare lontano dal punto previsto un pezzetto di spilla (le perle e la camicetta stanno più in là)
def pezzi(f):
    b, g, r = f[..., 0].astype(np.float32), f[..., 1].astype(np.float32), f[..., 2].astype(np.float32)
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
    a = f[..., 3] > 200 if f.shape[2] == 4 else np.ones(f.shape[:2], bool)
    blu = (b > r + 12) & (mx < 120) & a
    pelle = (r > 140) & (r - b > 42) & a
    return blu, pelle, mx, mn
# --- 1. dov'è la spilla, fotogramma per fotogramma (dove si vede tutta); dove non si vede il punto si stima tra prima e dopo
pos = [None] * n; cx, cy = x0, y0
for i in range(n):
    f = cv2.imread(f'{cart}/f{i:04d}.png', cv2.IMREAD_UNCHANGED)
    xa, ya = int(round(cx)) - R, int(round(cy)) - R
    blu, pelle, mx, mn = pezzi(f[ya:ya + 2 * R, xa:xa + 2 * R])
    iso = cv2.morphologyEx((~blu).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    k, lab, st, cen = cv2.connectedComponentsWithStats(iso, connectivity=8)
    meglio, pm = None, 1e9
    for j in range(1, k):
        x, y, w, h, ar = st[j]
        if x <= 0 or y <= 0 or x + w >= 2 * R or y + h >= 2 * R or ar < 120 or ar > 1300 or w < 22 or w > 70 or h < 10 or h > 40: continue
        d = np.hypot(cen[j][0] - R, cen[j][1] - R)
        if d < pm: pm, meglio = d, j
    if meglio is not None and pm <= 22:
        x, y, w, h, ar = st[meglio]; cx, cy = xa + x + (w - 1) / 2, ya + y + (h - 1) / 2; pos[i] = (cx, cy)
visti = [i for i in range(n) if pos[i] is not None]
if not visti: raise SystemExit('la spilla non si trova: controlla x e y')
stima = []
for i in range(n):
    if pos[i] is not None: stima.append(pos[i]); continue
    prima = max([j for j in visti if j < i], default=None); dopo = min([j for j in visti if j > i], default=None)
    if prima is None: stima.append(pos[dopo])
    elif dopo is None: stima.append(pos[prima])
    else: t = (i - prima) / (dopo - prima); stima.append((pos[prima][0] * (1 - t) + pos[dopo][0] * t, pos[prima][1] * (1 - t) + pos[dopo][1] * t))
# --- 2. la tinta: l'oro dei pezzi di una volta. A parità di luce, meno blu (e un filo più rosso dove è scura)
def oro(px):
    """px: puntini (blu, verde, rosso) della spilla chiara → dorati"""
    b, g, r = px[..., 0], px[..., 1], px[..., 2]
    lum = 0.114 * b + 0.587 * g + 0.299 * r
    kb = np.interp(lum, [50, 80, 120, 160, 190, 230], [0.80, 0.68, 0.67, 0.78, 0.86, 0.92])
    kr = np.interp(lum, [50, 80, 120, 160, 230], [1.06, 1.13, 1.07, 1.00, 1.00])
    kg = np.interp(lum, [50, 80, 120, 160, 230], [1.03, 1.07, 1.02, 0.99, 1.00])
    return np.stack([b * kb, g * kg, r * kr], axis=-1)
tinti = 0
for i in range(n):
    f = cv2.imread(f'{cart}/f{i:04d}.png', cv2.IMREAD_UNCHANGED); p = cv2.imread(f'{cartp}/f{i:04d}.png')
    cx, cy = stima[i]; xa, ya = int(round(cx)) - R, int(round(cy)) - R
    w = f[ya:ya + 2 * R, xa:xa + 2 * R]
    blu, pelle, mx, mn = pezzi(w)
    chiaro = (mx > 62) & (mx - mn < 62) & ~pelle & ~blu & (w[..., 3] > 200)
    k, lab, st, cen = cv2.connectedComponentsWithStats(chiaro.astype(np.uint8), connectivity=8)
    m = np.zeros(chiaro.shape, np.float32)
    for j in range(1, k):
        x, y, ww, hh, ar = st[j]
        if x <= 0 or y <= 0 or x + ww >= 2 * R or y + hh >= 2 * R or ar > 700: continue      # la camicetta e le cose grandi no
        if abs(cen[j][0] - R) > RX or abs(cen[j][1] - R) > RY: continue                     # le perle no
        m[lab == j] = 1
    if m.sum() < 8:
        cv2.imwrite(f'{out}/f{i:04d}.png', f); cv2.imwrite(f'{outp}/f{i:04d}.png', p); continue
    tinti += 1
    peso = cv2.GaussianBlur(cv2.dilate(m, np.ones((3, 3), np.uint8)), (0, 0), 0.8)[..., None]
    for im in (f, p):
        reg = im[ya:ya + 2 * R, xa:xa + 2 * R, :3].astype(np.float32)
        im[ya:ya + 2 * R, xa:xa + 2 * R, :3] = np.rint(np.clip(reg * (1 - peso) + oro(reg) * peso, 0, 255)).astype(np.uint8)
    cv2.imwrite(f'{out}/f{i:04d}.png', f); cv2.imwrite(f'{outp}/f{i:04d}.png', p)
json.dump(dict(visti=visti, stima=[[round(a, 1), round(b, 1)] for a, b in stima]), open(os.path.join(out, '..', os.path.basename(out) + '-spilla.json'), 'w'))
print(f'{n} fotogrammi: la spilla si vede tutta in {len(visti)}, tinta in {tinti}')
