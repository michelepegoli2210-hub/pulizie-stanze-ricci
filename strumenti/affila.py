# I pezzi di una volta (calmi e «parla») sono un po' più morbidi del video dei baci (che Gemini ha fatto più nitido): messi in fila
# si vedeva il cambio («si percepisce quando attacca uno e quando attacca un altro», Michele, 17/11). Qui si affilano appena, quanto
# basta per somigliare al video dei baci (viso, giacca, capelli). Solo il colore; la trasparenza resta com'è.
# E si intonano: il video dei baci ha i colori appena diversi (la giacca un filo più scura, il viso un filo meno rosso). Dove un
# pezzo attaccava l'altro, in un quinto di secondo cambiava il colore di tutta la figura. TINTA dice, canale per canale, quanto
# aggiungere a seconda di quanto è chiaro il puntino (misurata con misura-tinta.py sui due fotogrammi dove si attaccano, all'inizio
# e alla fine del video dei baci, e fatta la media: restano differenze sotto un livello e mezzo su 255).
#   python3 -I affila.py calmo parla     → nitido/<gruppo>/f%04d.png e nitido/<gruppo>-piatto/f%04d.png
import sys, os, numpy as np, cv2
SORG = '/home/claude/dev/spilla/film/out'; OUT = '/home/claude/dev/video1910/nitido'
R, Q = 1.0, 0.45
TINTA = np.array([   # ogni 8 livelli, da 0 a 256
    [-0.4, -1.6, -2.2, -2.9, -3.3, -3.5, -3.5, -3.5, -3.6, -3.6, -3.0, -1.2, 0.8, 2.0, 2.1, 2.1, 2.3, 2.4, 2.5, 2.5, 2.4, 2.2, 2.0, 2.1, 2.3, 2.4, 2.3, 2.2, 2.0, 1.7, 1.3, 1.0, 0.7],   # blu
    [0.1, 0.1, -0.1, -0.5, -0.6, -0.4, -0.0, 0.6, 1.5, 2.2, 2.5, 2.8, 3.0, 3.2, 3.5, 3.8, 4.1, 4.4, 4.5, 4.6, 4.5, 4.4, 4.1, 3.8, 3.3, 2.9, 2.7, 2.7, 2.7, 2.6, 2.1, 1.4, 0.8],   # verde
    [-0.6, -2.2, -2.6, -2.8, -2.8, -2.8, -2.9, -3.0, -2.8, -2.4, -2.1, -2.0, -2.1, -2.4, -2.5, -2.6, -2.6, -2.7, -2.8, -2.7, -2.5, -2.3, -1.9, -1.6, -1.3, -1.2, -1.0, -0.9, -0.7, -0.9, -1.2, -1.8, -0.6],   # rosso
], np.float32)
CURVA = np.stack([np.interp(np.arange(256), np.arange(0, 257, 8), t) for t in TINTA]).astype(np.float32)
def intona(col):
    """col: i tre canali (blu, verde, rosso) coi numeri con la virgola; rende gli stessi con la tinta del video dei baci"""
    o = np.empty_like(col)
    for c in range(3):
        v = np.clip(col[..., c], 0, 254.999); i0 = np.floor(v).astype(np.int32); t = v - i0
        o[..., c] = col[..., c] + CURVA[c][i0] * (1 - t) + CURVA[c][i0 + 1] * t
    return o
if __name__ == '__main__':
    for g in sys.argv[1:]:
        n = len([f for f in os.listdir(f'{SORG}/{g}') if f.endswith('.png')])
        for d in (g, g + '-piatto'): os.makedirs(f'{OUT}/{d}', exist_ok=True)
        for i in range(n):
            f = cv2.imread(f'{SORG}/{g}/f{i:04d}.png', cv2.IMREAD_UNCHANGED).astype(np.float32)
            a = f[..., 3:4] / 255
            # la sfocatura conta solo i puntini di lei (se no ai bordi entrerebbe il nero di fuori)
            b = cv2.GaussianBlur(f[..., :3] * a, (0, 0), R) / np.maximum(cv2.GaussianBlur(a, (0, 0), R)[..., None], 0.02)
            col = np.where(a > 0.02, intona(np.clip(f[..., :3] + Q * (f[..., :3] - b), 0, 255)), f[..., :3])
            cv2.imwrite(f'{OUT}/{g}/f{i:04d}.png', np.rint(np.dstack([np.clip(col, 0, 255), f[..., 3]])).astype(np.uint8))
            p = cv2.imread(f'{SORG}/{g}-piatto/f{i:04d}.png').astype(np.float32)
            # nel piatto si affila e si intona solo lei (la sala dietro è sfocata apposta: resta com'è)
            bp = cv2.GaussianBlur(p, (0, 0), R)
            pa = np.clip(p + Q * (p - bp) * a, 0, 255)
            cv2.imwrite(f'{OUT}/{g}-piatto/f{i:04d}.png', np.rint(np.clip(pa + (intona(pa) - pa) * a, 0, 255)).astype(np.uint8))
        print(g, n, 'fotogrammi', flush=True)
