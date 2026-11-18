# 1.98.0 · le icone delle notifiche: il disegno di Gemini (mat-*.webp) nel tondo colorato dei cartoncini della Segreteria
# (faccia, contorno dello stesso colore più scuro, lo spessore sotto a sinistra). 192x192, PNG.
import sys
from PIL import Image, ImageDraw, ImageFilter
import os
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = sys.argv[1] if len(sys.argv) > 1 else REPO   # python3 strumenti/fai-icone-notifiche.py
COL = {  # faccia, contorno (i colori della proposta 1, come nella Segreteria)
  "giallo": ("#FDE882", "#6F5410"), "corallo": ("#FA9592", "#751A1A"), "lilla": ("#DEC1EB", "#5B4570"), "rosa": ("#F7C6DB", "#6A2A44"),
  "verdeacqua": ("#BBE9D1", "#3B6B59"), "verde": ("#B2E0AF", "#245530"), "salmone": ("#FDC8AA", "#7E4A36"), "azzurro": ("#ABDBF2", "#2B5D7E"),
  "sapere": ("#A4D8F5", "#1D4A6B"),
}
ICONE = {  # nome → (disegno, colore)
  "sveglia": ("sveglia", "giallo"), "dafare": ("spunte", "corallo"), "email": ("busta", "lilla"), "prenotazione": ("chiave", "rosa"),
  "messaggio": ("fumetto", "verdeacqua"), "urgente": ("attenzione", "corallo"), "pulizie": ("secchio", "verde"), "arrivi": ("arrivi", "salmone"),
  "sera": ("casa", "azzurro"), "foglio": ("spunte", "azzurro"), "sintesi": ("lettera", "sapere"), "social": ("megafono", "rosa"),
  "lettura": ("fumetto", "giallo"), "casa": ("casa", "salmone"),
}
def hexrgb(h): h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
S = 4; L = 192 * S
for nome, (dis, col) in ICONE.items():
    faccia, bordo = hexrgb(COL[col][0]), hexrgb(COL[col][1])
    im = Image.new("RGBA", (L, L), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    r = 86 * S; cx = cy = 96 * S; sp = 5 * S   # lo spessore: il tondo sporge un poco sotto a sinistra
    sx = cx - sp // 2; sy = cy - sp // 2
    d.ellipse((sx - r + sp, sy - r + sp, sx + r + sp, sy + r + sp), fill=bordo + (255,))   # lo spessore
    d.ellipse((sx - r, sy - r, sx + r, sy + r), fill=bordo + (255,))                     # il contorno
    ri = r - 6 * S
    d.ellipse((sx - ri, sy - ri, sx + ri, sy + ri), fill=faccia + (255,))                 # la faccia
    # la luce in alto a sinistra (come i cartoncini: un filo più chiaro)
    luce = Image.new("RGBA", (L, L), (0, 0, 0, 0)); dl = ImageDraw.Draw(luce)
    dl.ellipse((sx - ri, sy - ri, sx + ri, sy + ri), outline=(255, 255, 255, 110), width=3 * S)
    m = Image.new("L", (L, L), 0); ImageDraw.Draw(m).pieslice((sx - ri, sy - ri, sx + ri, sy + ri), 150, 300, fill=255)
    im.alpha_composite(Image.composite(luce, Image.new("RGBA", (L, L), (0, 0, 0, 0)), m))
    # il disegno, al centro
    di = Image.open(f"{REPO}/mat-{dis}.webp").convert("RGBA"); di = di.crop(di.getchannel("A").getbbox())   # via il bordo vuoto
    lato = int(ri * 2 * 0.72); k = lato / max(di.width, di.height); di = di.resize((max(1, round(di.width * k)), max(1, round(di.height * k))), Image.LANCZOS)
    im.alpha_composite(di, (sx - di.width // 2, sy - di.height // 2))
    im = im.resize((192, 192), Image.LANCZOS)
    im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(f"{OUT}/notifica-{nome}.png", optimize=True)   # 256 colori: un terzo del peso
print("icone:", len(ICONE))
