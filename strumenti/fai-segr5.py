#!/usr/bin/env python3
# 1.85.0 · I FILMATI NUOVI DI SOFIA SEGRETARIA (Michele, 15/11: «il suo filmato salta troppo… in alto a sinistra è troppo
# piccola e quando parla non si capisce»). Dai segr4 (540x960, lei solo nella parte alta) si fanno i segr5:
#  - tagliati attorno a lei, 480x640 (meno della metà dei punti da decodificare: il telefono fa meno fatica, meno scatti);
#  - il giro senza salto: gli ultimi 12 fotogrammi sfumano nei primi (la fine combacia con l'inizio);
#  - IL BORDO DI SOTTO CHE LAMPEGGIAVA: nei segr4 un fotogramma ogni pochi ha la sfumatura sotto il petto (fino a y 695) e gli
#    altri no (taglio a y 660): il fondo di lei saltava su e giù ~6 volte al secondo. Adesso la sfumatura è la stessa per tutti
#    (da y 620 a y 657, dove i due tipi di fotogramma sono uguali) e sotto niente;
#  - il bordo dei capelli che tremolava: la trasparenza dei punti che cambiano poco (il tremolio, non il movimento) si media
#    col fotogramma prima e dopo.
# Uso: python3 fai-segr5.py <cartella dei fotogrammi segr4 (riposo-001.png…)> <cartella di uscita>
import sys, os, glob, subprocess, numpy as np
from PIL import Image
SRC, OUT = sys.argv[1], sys.argv[2]
TAGLIO = (24, 64, 504, 664)   # x0, y0, x1, y1: 480 x 600
FADE0, FADE1 = 620, 657       # la sfumatura di sotto, uguale per tutti i fotogrammi (nel 540x960 di partenza)
K = 12                        # fotogrammi della sfumatura del giro (mezzo secondo)
os.makedirs(OUT, exist_ok=True)
def premolt(a):
    a = a.astype(np.float32); al = a[..., 3:4] / 255.0
    return np.concatenate([a[..., :3] * al, a[..., 3:4]], axis=-1)
def smolt(p):
    al = p[..., 3:4] / 255.0
    rgb = np.where(al > 1e-4, p[..., :3] / np.maximum(al, 1e-4), 0)
    return np.clip(np.concatenate([rgb, p[..., 3:4]], axis=-1) + 0.5, 0, 255).astype(np.uint8)
for nome in ["riposo", "ascolta", "parla"]:
    fs = sorted(glob.glob(os.path.join(SRC, f"{nome}-*.png")))
    R = [np.asarray(Image.open(f).convert("RGBA")).astype(np.float32) for f in fs]
    g = np.ones(960, np.float32); g[FADE0:FADE1] = np.linspace(1, 0, FADE1 - FADE0, endpoint=False); g[FADE1:] = 0
    for r in R: r[..., 3] *= g[:, None]
    # il tremolio del bordo: media con prima e dopo solo dove la trasparenza cambia poco (sotto 40 su 255)
    A = [r[..., 3].copy() for r in R]
    for i in range(len(R)):
        p, s = A[i - 1], A[(i + 1) % len(R)]
        m = (np.abs(p - A[i]) < 40) & (np.abs(s - A[i]) < 40)
        R[i][..., 3] = np.where(m, 0.25 * p + 0.5 * A[i] + 0.25 * s, A[i])
    x0, y0, x1, y1 = TAGLIO
    F = [premolt(np.clip(r[y0:y1, x0:x1] + 0.5, 0, 255).astype(np.uint8)) for r in R]
    N = len(F); L = N - K
    out = []
    for i in range(L):
        if i < K:
            w = (i + 1) / (K + 1)            # all'inizio quasi tutto la coda, poi sempre più l'inizio vero
            out.append(F[N - K + i] * (1 - w) + F[i] * w)
        else:
            out.append(F[i])
    d = os.path.join(OUT, "fr-" + nome); os.makedirs(d, exist_ok=True)
    for f in glob.glob(os.path.join(d, "*.png")): os.remove(f)
    for i, p in enumerate(out): Image.fromarray(smolt(p), "RGBA").save(os.path.join(d, f"{i:03d}.png"))
    webm = os.path.join(OUT, f"segr5-{nome}-3d.webm")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "24", "-i", os.path.join(d, "%03d.png"), "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
                    "-b:v", "0", "-crf", "36", "-row-mt", "1", "-deadline", "good", "-cpu-used", "1", "-g", "48", "-auto-alt-ref", "0", "-an", webm], check=True)
    print(nome, "fotogrammi", N, "->", L, "·", webm, os.path.getsize(webm) // 1024, "KB")
# la foto ferma (il primo fotogramma del giro «sta ferma»)
Image.open(os.path.join(OUT, "fr-riposo", "000.png")).save(os.path.join(OUT, "segr5-poster-3d.webp"), "WEBP", quality=88, method=6)
print("poster", os.path.getsize(os.path.join(OUT, "segr5-poster-3d.webp")) // 1024, "KB")
