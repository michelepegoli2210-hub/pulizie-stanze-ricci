# Quanto «salta» la grana a ogni fotogramma chiave di un filmato codificato (il fotogramma chiave è rifatto da capo: dove lei è ferma
# la grana dei capelli e della giacca cambia tutta insieme, un piccolo tremolio). Legge un fotogramma alla volta.
#   python3 -I misura_chiave.py <filmato> [<filmato> …]
import sys, subprocess, numpy as np
W, H = 270, 480
def chiavi(f):
    k = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=flags', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout.split()
    return [i for i, x in enumerate(k) if 'K' in x]
def cambi(f):
    alfa = f.endswith('.webm')
    p = subprocess.Popen(['ffmpeg', '-v', 'error'] + (['-c:v', 'libvpx-vp9'] if alfa else []) + ['-i', f, '-vf', f'scale={W}:{H}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], stdout=subprocess.PIPE)
    n = W * H * 4; prec = primo = None; c = []
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        a = np.frombuffer(b, np.uint8).reshape(H, W, 4).astype(np.float32); al = a[..., 3:4] / 255; x = a[..., :3] * al + 190 * (1 - al)
        if prec is not None: c.append(float(np.abs(x - prec).mean()))
        else: primo = x
        prec = x
    p.stdout.close(); p.wait()
    c.append(float(np.abs(primo - prec).mean()))   # dall'ultimo di nuovo al primo
    return np.array(c)
if __name__ == '__main__':
    for f in sys.argv[1:]:
        c = cambi(f); n = len(c); K = chiavi(f)
        salti = [(k, c[k - 1], (c[k - 2] + c[k]) / 2) for k in K if k > 1]
        riga = f"{f.split('/')[-1]}: {n} fotogrammi, {len(K)} chiave (i primi: {K[:7]}); cambio mediano {np.median(c):.2f}; ricomincia (ultimo→primo) {c[-1]:.2f}"
        if salti:
            piu = np.array([s[1] - s[2] for s in salti]); fermi = [s for s in salti if s[2] < 0.25]
            riga += f"; al fotogramma chiave {np.mean([s[1] for s in salti]):.2f} contro {np.mean([s[2] for s in salti]):.2f} dei vicini"
            if fermi: riga += f"; dove sta ferma ({len(fermi)} volte) {np.mean([s[1] for s in fermi]):.2f} contro {np.mean([s[2] for s in fermi]):.2f}"
        print(riga, flush=True)
