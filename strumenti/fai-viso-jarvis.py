# il viso piccolo di Jarvis (1.101.0): dal ritaglio della foto di lei (senza sfondo), nel tondo con un fondo avorio e oro (niente rosa)
#   python3 -I fai-viso.py ritaglio.png uscita.webp cx cy lato
import sys, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, dst, cx, cy, lato = sys.argv[1], sys.argv[2], *map(int, sys.argv[3:6])
im = Image.open(src).convert("RGBA")
q = im.crop((cx - lato // 2, cy - lato // 2, cx + lato // 2, cy + lato // 2)).resize((640, 640), Image.LANCZOS)
# il fondo: avorio al centro, oro chiaro verso il bordo
y, x = np.mgrid[0:640, 0:640].astype(np.float32)
r = np.sqrt((x - 320) ** 2 + (y - 290) ** 2) / 330
c0, c1 = np.array([252, 248, 240], np.float32), np.array([236, 220, 182], np.float32)
t = np.clip(r, 0, 1)[..., None] ** 1.6
fondo = Image.fromarray(np.dstack([(c0 * (1 - t) + c1 * t), np.full((640, 640), 255, np.float32)]).clip(0, 255).astype(np.uint8), "RGBA")
fondo.alpha_composite(q)
# il tondo (fatto grande e rimpicciolito: il bordo è liscio)
m = Image.new("L", (640, 640), 0); ImageDraw.Draw(m).ellipse((0, 0, 639, 639), fill=255)
fondo.putalpha(m)
fondo.resize((240, 240), Image.LANCZOS).save(dst, "WEBP", quality=90, method=6)
print(dst, Image.open(dst).size)
