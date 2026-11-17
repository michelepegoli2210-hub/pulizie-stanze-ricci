# Sofia segretaria col rosa: i video col verde dietro → fotogrammi ritagliati (senza sfondo) nella misura dell'app (540x960).
# Si tiene tutto quello che non è verde: lei, il tablet, il bancone, il campanello, lo schermo del computer e la tastiera.
#   python3 -I ritaglia_video.py <video> <cartella di uscita>
import sys, os, subprocess, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import verde
W0, H0, W, H = 720, 1280, 540, 960
src, out = sys.argv[1], sys.argv[2]; os.makedirs(out, exist_ok=True)
# (il video si porta sempre a 720x1280: quelli di Flow scaricati a 1080p sono 1080x1920)
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vf", f"scale={W0}:{H0}:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
n = W0 * H0 * 3; k = 0; prec = None
while True:
    buf = p.stdout.read(n)
    if len(buf) < n: break
    fr = np.frombuffer(buf, np.uint8).reshape(H0, W0, 3)
    rgba = verde.ritaglia(fr).astype(np.float32)
    a = rgba[..., 3:4] / 255
    # si rimpicciolisce col colore già moltiplicato per la trasparenza (così sul bordo non entra il verde di fuori)
    pm = cv2.resize(np.dstack([rgba[..., :3] * a, rgba[..., 3:4]]), (W, H), interpolation=cv2.INTER_AREA)
    al = pm[..., 3:4] / 255
    # niente tremolio dove sta ferma (come negli altri filmati)
    m = al[..., 0]
    if prec is not None:
        fermo = np.abs(m - prec) < 0.12
        m = np.where(fermo, 0.65 * prec + 0.35 * m, m)
    prec = m.copy()
    col = np.where(al > 0.004, pm[..., :3] / np.maximum(al, 0.004), 0)
    fin = np.dstack([np.clip(col, 0, 255), np.clip(m * 255, 0, 255)])
    cv2.imwrite(os.path.join(out, f"f{k:04d}.png"), cv2.cvtColor(np.clip(fin + 0.5, 0, 255).astype(np.uint8), cv2.COLOR_RGBA2BGRA))
    k += 1
p.stdout.close(); p.wait()
print(out, k, "fotogrammi")
