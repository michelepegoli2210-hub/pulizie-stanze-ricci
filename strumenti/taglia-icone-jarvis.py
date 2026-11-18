# le 8 icone di Jarvis (Gemini, 18/11): il foglio 4x2 su fondo bianco → 8 icone senza sfondo (192x192, webp)
# il bianco si toglie solo dove tocca il bordo della casella (riempimento dal bordo): i riflessi bianchi dentro restano
import sys, numpy as np, cv2
from PIL import Image
NOMI = ["oggi", "impegni", "obiettivi", "idee", "traguardi", "piano", "sveglia", "mic"]
im = np.asarray(Image.open(sys.argv[1]).convert("RGB")).astype(np.int16)
H, W, _ = im.shape
out = sys.argv[2]
for k, nome in enumerate(NOMI):
    r, c = divmod(k, 4)
    x0, x1 = round(c * W / 4), round((c + 1) * W / 4); y0, y1 = round(r * H / 2), round((r + 1) * H / 2)
    cel = im[y0:y1, x0:x1]
    # quanto è lontano dal bianco
    dist = 255 - cel.min(axis=2)
    quasi = (dist < 26).astype(np.uint8)            # quasi bianco
    h, w = quasi.shape
    m = np.zeros((h + 2, w + 2), np.uint8); fondo = quasi.copy()
    # riempio dal bordo: il fondo è il quasi-bianco collegato al bordo
    sem = np.zeros_like(quasi)
    for (yy, xx) in [(0, i) for i in range(w)] + [(h - 1, i) for i in range(w)] + [(i, 0) for i in range(h)] + [(i, w - 1) for i in range(h)]:
        if quasi[yy, xx] and not sem[yy, xx]:
            cv2.floodFill(fondo, m, (xx, yy), 2)
            sem = (fondo == 2).astype(np.uint8)
    bg = (fondo == 2)
    a = np.where(bg, 0.0, 1.0)
    # il bordo morbido: dove il fondo tocca l'icona, la trasparenza segue quanto è bianco il punto
    bordo = cv2.dilate(bg.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & ~bg
    a = np.where(bordo, np.clip(dist / 60.0, 0, 1), a)
    a = cv2.GaussianBlur(a.astype(np.float32), (0, 0), 0.7)
    a[bg] = np.minimum(a[bg], 0.0)
    ys, xs = np.where(a > 0.05)
    by0, by1, bx0, bx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    rgba = np.dstack([cel.astype(np.uint8), (a * 255).astype(np.uint8)])[by0:by1, bx0:bx1]
    # nel quadrato, centrata, col margine
    lato = int(max(by1 - by0, bx1 - bx0) * 1.06)
    q = Image.new("RGBA", (lato, lato), (0, 0, 0, 0))
    q.alpha_composite(Image.fromarray(rgba, "RGBA"), ((lato - (bx1 - bx0)) // 2, (lato - (by1 - by0)) // 2))
    q = q.resize((192, 192), Image.LANCZOS)
    q.save(f"{out}/jv-ico-{nome}.webp", quality=90, method=6)
    q.save(f"{out}/jv-ico-{nome}.png")
    print(nome, (bx1 - bx0, by1 - by0), "→ 192")
