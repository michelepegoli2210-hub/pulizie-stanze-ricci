# CONTA-LAMPI. I «lampi» del ritaglio: puntini dove la sagoma sparisce (o compare) per uno o due fotogrammi mentre l'immagine lì resta uguale
# (quindi non è movimento: è uno sbaglio del ritaglio).   python3 -I strumenti/conta-lampi.py <piatti> <ritagli> [<ritagli> …]
import sys, os, numpy as np, cv2
PIA = sys.argv[1]
n = len([x for x in os.listdir(PIA) if x.endswith('.png')])
P = [cv2.GaussianBlur(cv2.imread(f'{PIA}/f{i:04d}.png', cv2.IMREAD_COLOR), (0, 0), 1.2).astype(np.float32) for i in range(n)]
def stessa(i, j): return np.abs(P[i] - P[j]).mean(axis=2) < 10
for D in sys.argv[2:]:
    A = [cv2.imread(f'{D}/f{i:04d}.png', cv2.IMREAD_UNCHANGED)[..., 3].astype(np.float32) / 255 for i in range(n)]
    spar = []; comp = []
    for t in range(1, n - 2):
        f1 = stessa(t, t - 1) & stessa(t, t + 1)
        s1 = (A[t] < 0.3) & (A[t - 1] > 0.7) & (A[t + 1] > 0.7) & f1
        c1 = (A[t] > 0.7) & (A[t - 1] < 0.3) & (A[t + 1] < 0.3) & f1
        f2 = stessa(t, t - 1) & stessa(t + 1, t + 2) & stessa(t, t + 1)
        s2 = (A[t] < 0.3) & (A[t + 1] < 0.3) & (A[t - 1] > 0.7) & (A[t + 2] > 0.7) & f2
        c2 = (A[t] > 0.7) & (A[t + 1] > 0.7) & (A[t - 1] < 0.3) & (A[t + 2] < 0.3) & f2
        spar.append(int(s1.sum() + s2.sum())); comp.append(int(c1.sum() + c2.sum()))
    spar = np.array(spar); comp = np.array(comp)
    print(f"== {D}: spariti per 1-2 fotogrammi {spar.sum()} puntini (i peggiori: {' '.join(f'{int(i) + 1}:{spar[i]}' for i in np.argsort(-spar)[:10] if spar[i] > 0)}); comparsi {comp.sum()} (i peggiori: {' '.join(f'{int(i) + 1}:{comp[i]}' for i in np.argsort(-comp)[:8] if comp[i] > 0)})")
