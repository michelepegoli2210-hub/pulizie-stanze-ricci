# Controllo dei filmati messi in fila (giro/ferma, giro/ascolta, giro/parla): il cambio da un fotogramma all'altro attorno agli
# attacchi e dove il filmato ricomincia, a confronto col cambio normale del video (non deve esserci un gradino).
#   python3 -I controlla_segr.py
import os, json, numpy as np, cv2
QUI = os.path.dirname(os.path.abspath(__file__)); G = f'{QUI}/giro'
def rit(d, i):
    f = cv2.resize(cv2.imread(f'{G}/{d}/f{i:04d}.png', cv2.IMREAD_UNCHANGED), (270, 480), interpolation=cv2.INTER_AREA).astype(np.float32); a = f[..., 3:4] / 255
    return f[..., :3] * a + 190 * (1 - a)
def viso(d, i):
    f = cv2.imread(f'{G}/{d}/f{i:04d}.png', cv2.IMREAD_UNCHANGED)[150:400, 150:400].astype(np.float32); a = f[..., 3:4] / 255
    return f[..., :3] * a + 190 * (1 - a)
info = json.load(open(f'{G}/segr.json')); male = 0
for d, punti in (('ferma', [i - 1 for i in info['inizi'][1:]] + [info['ferma'] - 1]), ('ascolta', [info['ascolta'] - 1]), ('parla', [info['parla'] - 1])):
    n = info[d]; R = [rit(d, i) for i in range(n)]; V = [viso(d, i) for i in range(n)]
    c = np.array([float(np.abs(R[(i + 1) % n] - R[i]).mean()) for i in range(n)]); cv = np.array([float(np.abs(V[(i + 1) % n] - V[i]).mean()) for i in range(n)])
    print(f"== {d}: {n} fotogrammi ({n / 24:.2f} s); cambio mediano {np.median(c):.2f}, 95% {np.percentile(c, 95):.2f}, massimo {c.max():.2f} (a {int(c.argmax())}); viso mediano {np.median(cv):.2f}, massimo {cv.max():.2f} (a {int(cv.argmax())})")
    for p in punti:
        ii = [(p + k) % n for k in range(-5, 4)]
        print(f"   attorno a {p}->{(p + 1) % n}: tutta " + ' '.join(f"{c[i]:.2f}" for i in ii) + "  · viso " + ' '.join(f"{cv[i]:.2f}" for i in ii))
        gr = max(c[i] for i in ii)
        if gr > max(1.2, 2.5 * np.percentile(c, 95)): male += 1; print("   !!! gradino")
    # fotogrammi uguali di fila (fermo immagine) e passi doppi
    fermi = [i for i in range(n) if c[i] < 0.02]
    if fermi: print("   fotogrammi fermi:", fermi[:20])
print("TUTTO BENE" if not male else f"DA GUARDARE: {male}")
