# Dal foglio dei disegni di Gemini (ripreso dallo schermo a strisce) ai disegnini da soli, senza sfondo, 240x240.
#   python3 taglia_disegni.py
from PIL import Image
import numpy as np, cv2
d = '/home/claude/dev/gemini1930/'
su, me, gi = [np.asarray(Image.open(d + n).convert('RGB')) for n in ('foglio-su.png', 'foglio-mezzo.png', 'foglio-giu.png')]
F = np.zeros((286 + 375, 885, 3), np.uint8); F[:375] = su; F[224:224 + 375] = me; F[286:] = gi
Image.fromarray(F).save(d + 'foglio.png')
NOMI = ['microfono', 'matita', 'megafono', 'telefono', 'documento', 'fumetto', 'lettera', 'spunta', 'graffetta', 'cassetta', 'chiave', 'attenzione']
# gli angoli del foglio (arrotondati, fuori c'è il nero della pagina): si rimettono bianchi
g = F.astype(np.int16); scuro_fuori = (g.max(axis=2) < 60)
n, lab = cv2.connectedComponents(scuro_fuori.astype(np.uint8))
for k in range(1, n):
    ys, xs = np.where(lab == k)
    if (xs.min() == 0 or xs.max() == F.shape[1] - 1) and (ys.min() == 0 or ys.max() == F.shape[0] - 1) and len(xs) < 4000: F[lab == k] = 255   # un angolo
bianco = (F.min(axis=2) > 236)
# i disegni: le macchie non bianche; si uniscono le parti vicine (le onde del telefono, i puntini) con una dilatazione
m = cv2.dilate((~bianco).astype(np.uint8), np.ones((17, 17), np.uint8))
n, lab, st, cen = cv2.connectedComponentsWithStats(m)
pezzi = [(st[k], cen[k]) for k in range(1, n) if st[k][4] > 3000]
print(len(pezzi), 'disegni trovati')
H, W = F.shape[:2]; out = {}
for s, c in pezzi:
    col, rig = min(3, int(c[0] / (W / 4))), min(2, int(c[1] / (H / 3))); i = rig * 4 + col
    x, y, w, h = s[0], s[1], s[2], s[3]
    x0, y0, x1, y1 = max(0, x + 4), max(0, y + 4), min(W, x + w - 4), min(H, y + h - 4)   # la dilatazione ha allargato di 8
    out[i] = (x0, y0, x1, y1)
for i, nome in enumerate(NOMI):
    if i not in out: print('MANCA', nome); continue
    x0, y0, x1, y1 = out[i]; p = F[y0:y1, x0:x1].astype(np.float32)
    # lo sfondo: il bianco attaccato al bordo del ritaglio (non il bianco dentro al disegno: il foglio della lettera, i denti…)
    b = (p.min(axis=2) > 232).astype(np.uint8); b = cv2.copyMakeBorder(b, 2, 2, 2, 2, cv2.BORDER_CONSTANT, value=1)
    nn, ll = cv2.connectedComponents(b); fuori = (ll == ll[0, 0])[2:-2, 2:-2]
    # il bordo morbido: quanto bianco c'è nei puntini accanto allo sfondo
    vicino = cv2.dilate(fuori.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & ~fuori
    a = np.ones(p.shape[:2], np.float32); a[fuori] = 0
    forza = np.clip((255 - p.min(axis=2)) / 70.0, 0, 1); a[vicino] = np.maximum(forza[vicino], 0.15)
    a = cv2.GaussianBlur(a, (0, 0), 0.6); a[fuori & (cv2.erode(fuori.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0)] = 0
    # il colore dei bordi senza il bianco mescolato
    aa = np.maximum(a, 0.08)[..., None]; rgb = np.clip((p - (1 - aa) * 255) / aa, 0, 255)
    rgb[a > 0.97] = p[a > 0.97]
    im = Image.fromarray(np.dstack([rgb, a * 255]).astype(np.uint8), 'RGBA')
    lato = max(im.size) + 12; q = Image.new('RGBA', (lato, lato), (0, 0, 0, 0)); q.paste(im, ((lato - im.width) // 2, (lato - im.height) // 2))
    q = q.resize((240, 240), Image.LANCZOS); q.save(d + f'mat-{nome}.webp', 'WEBP', quality=90, method=6)
    print(f'mat-{nome}.webp  ritaglio {x1 - x0}x{y1 - y0}')
# il foglio di controllo: tutti su panna e su scuro
N = len(NOMI); c = Image.new('RGB', (4 * 250, 3 * 250 * 2), '#FFFDF6')
from PIL import ImageDraw
ImageDraw.Draw(c).rectangle([0, 750, 1000, 1500], fill='#3a3f4a')
for i, nome in enumerate(NOMI):
    try: q = Image.open(d + f'mat-{nome}.webp')
    except Exception: continue
    c.paste(q, (5 + (i % 4) * 250, 5 + (i // 4) * 250), q); c.paste(q, (5 + (i % 4) * 250, 755 + (i // 4) * 250), q)
c.save(d + 'controllo.png')
