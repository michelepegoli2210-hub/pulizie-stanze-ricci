# 1.91.0 · IL VIDEO DEI BACI (Michele, 17/11: «questo è il video di sofia che mi manda i baci ed è bellissimo»).
# L'ha fatto lui con Gemini partendo dalla Sofia dell'app (stessa foto, stessa inquadratura, ha già la spilla): 10 secondi in
# cui saluta da Miss, porta la mano al petto, manda un bacio e torna nella posa di partenza.
# Qui: i suoi 240 fotogrammi nella misura dell'app (540x960), piatti (con la sala) e ritagliati (senza sfondo) ESATTAMENTE come
# gli altri pezzi (stessa ricetta di video1730/costruisci.py: maschera u2net_human_seg, filtro guidato, un pezzo solo, niente
# tremolio dove sta ferma, colori del bordo ripuliti dalla sala).
# 1.93.0: lo stesso per ogni video nuovo di Gemini (capelli e collana, ferma tranquilla…): il nome del pezzo è il terzo dato.
#   python3 -I ritaglia_gemini.py <video> <cartella di uscita> <nome>   → <uscita>/<nome>/f%04d.png (RGBA) e <uscita>/<nome>-piatto/f%04d.png
import sys, os, subprocess, numpy as np, cv2, onnxruntime as ort, importlib.util
spec = importlib.util.spec_from_file_location('rit', '/home/claude/dev/s3d/ritaglia.py'); rit = importlib.util.module_from_spec(spec); spec.loader.exec_module(rit)
W, H = 540, 960
SRC, OUT, NOME = sys.argv[1], sys.argv[2], sys.argv[3]
def fotogrammi(path):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = W * H * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n: break
        yield np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    p.stdout.close(); p.wait()
sess = ort.InferenceSession(rit.MODELLO, providers=["CPUExecutionProvider"]); nome_in = sess.get_inputs()[0].name
media = np.array([0.485, 0.456, 0.406], np.float32); dev = np.array([0.229, 0.224, 0.225], np.float32)
def maschera(fr):
    piccolo = cv2.resize(fr, (320, 320), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    x = ((piccolo - media) / dev).transpose(2, 0, 1)[None]
    pred = sess.run(None, {nome_in: x})[0][0, 0]; pred = (pred - pred.min()) / (pred.max() - pred.min() + 1e-8)
    m = cv2.resize(pred, (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)
    g = cv2.cvtColor(fr, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    m = rit.filtro_guidato(g, m, r=6, eps=2e-3); m = np.clip((m - 0.15) / 0.7, 0, 1); return rit.un_pezzo(m)
for d in (NOME, NOME + "-piatto"): os.makedirs(os.path.join(OUT, d), exist_ok=True)
prec = None; k = 0
for fr in fotogrammi(SRC):
    cv2.imwrite(os.path.join(OUT, NOME + "-piatto", f"f{k:04d}.png"), cv2.cvtColor(fr, cv2.COLOR_RGB2BGR))
    m = maschera(fr)
    if prec is not None:
        fermo = np.abs(m - prec) < 0.12
        m = np.where(fermo, 0.65 * prec + 0.35 * m, m)
    prec = m.copy()
    rgb = rit.decontamina(fr, m)
    cv2.imwrite(os.path.join(OUT, NOME, f"f{k:04d}.png"), cv2.cvtColor(np.dstack([rgb, (m * 255 + 0.5).astype(np.uint8)]), cv2.COLOR_RGBA2BGRA))
    k += 1
    if k % 40 == 0: print(k, flush=True)
print("FINITO", k, "fotogrammi", flush=True)
