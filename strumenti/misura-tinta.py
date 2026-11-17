# La tinta: il video dei baci (di Gemini) ha i colori appena diversi dai pezzi di una volta (la giacca un filo più scura, il viso un
# filo meno rosso). Dove un pezzo attacca l'altro, in un quinto di secondo cambiava il colore di tutta la figura: si percepiva.
# Qui si misura la differenza sui due fotogrammi dove si attaccano (stessa posa: 0,2 puntini di spostamento) e si fa una curva per
# canale (blu, verde, rosso): quanto aggiungere o togliere a seconda di quanto è chiaro il puntino. Poi affila.py la applica.
#   python3 -I misura_tinta.py <fotogramma di una volta, affilato> <fotogramma del video dei baci> <dove scrivere la curva .npy>
import sys, numpy as np, cv2
A = cv2.imread(sys.argv[1], cv2.IMREAD_UNCHANGED).astype(np.float32); B = cv2.imread(sys.argv[2], cv2.IMREAD_UNCHANGED).astype(np.float32)
m = (A[..., 3] > 250) & (B[..., 3] > 250)
m = cv2.erode(m.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
m[505:580, 280:360] = False   # la spilla (quella di Gemini è più chiara: non c'entra con la tinta)
Ab = cv2.GaussianBlur(A[..., :3], (0, 0), 2.0); Bb = cv2.GaussianBlur(B[..., :3], (0, 0), 2.0)
curva = np.zeros((3, 256), np.float32)
for c in range(3):
    v = Ab[..., c][m]; d = (Bb[..., c] - Ab[..., c])[m]
    xs, ys, ns = [], [], []
    for lo in range(0, 256, 8):
        s = (v >= lo) & (v < lo + 8)
        if s.sum() >= 400: xs.append(float(v[s].mean())); ys.append(float(np.median(d[s]))); ns.append(int(s.sum()))
    xs, ys = np.array(xs), np.array(ys)
    # liscia (media pesata dei vicini) e mai più di 7 livelli
    ysl = ys.copy()
    for k in range(len(ys)):
        a, b = max(0, k - 1), min(len(ys), k + 2); w = np.array(ns[a:b], np.float32); ysl[k] = float((ys[a:b] * w).sum() / w.sum())
    curva[c] = np.clip(np.interp(np.arange(256), xs, ysl), -7, 7)
    # agli estremi (pochi puntini) si spegne piano
    lo, hi = int(xs[0]), int(xs[-1])
    if lo > 0: curva[c, :lo] = curva[c, lo] * np.linspace(0.3, 1, lo)
    if hi < 255: curva[c, hi + 1:] = curva[c, hi] * np.linspace(1, 0.3, 255 - hi)
    print('BGR'[c], 'tra', round(xs[0]), 'e', round(xs[-1]), ':', ' '.join(f'{round(x)}:{y:+.1f}' for x, y in zip(xs, ysl)))
np.save(sys.argv[3], curva)
