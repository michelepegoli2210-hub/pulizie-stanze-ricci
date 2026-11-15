#!/usr/bin/env python3
# 1.84.0 · I FILMATI DI SOFIA PER L'IPHONE. L'iPhone non sa far vedere i webm trasparenti (VP9 con alfa): da ognuno si fa
# un mp4 H.264 «a piani», 540 x (960 + 16 + 960): sopra il colore già moltiplicato per la trasparenza (fuori da lei è nero),
# una striscia nera, sotto la trasparenza in grigio (bianco = lei, nero = niente). Il lettore dell'app (la tela) li rimette
# insieme. Si lavora in YUV, senza passare dall'RGB: i colori restano quelli del webm, fotogramma per fotogramma.
# Uso: python3 fa-alfa.py entrata.webm uscita.mp4 [crf] [gop]   (1.85.0: qualsiasi misura, la prende dal webm)
import sys, subprocess, numpy as np
src, dst = sys.argv[1], sys.argv[2]
crf = sys.argv[3] if len(sys.argv) > 3 else "23"
gop = sys.argv[4] if len(sys.argv) > 4 else "24"
P = 16
# 1.85.0: la misura la prende dal filmato (i segr5 sono 480x600; i primi erano tutti 540x960)
_d = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", src], capture_output=True, text=True, check=True).stdout.strip().split(",")
W, H = int(_d[0]), int(_d[1])
dec = subprocess.Popen(["ffmpeg", "-v", "error", "-c:v", "libvpx-vp9", "-i", src, "-f", "rawvideo", "-pix_fmt", "yuva420p", "-"], stdout=subprocess.PIPE)
enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "yuv420p", "-s", f"{W}x{2*H+P}", "-r", "24", "-i", "-",
                        "-c:v", "libx264", "-preset", "slow", "-crf", crf, "-profile:v", "high", "-level:v", "4.0", "-g", gop,
                        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", dst], stdin=subprocess.PIPE)
fs, cs = W * H, (W // 2) * (H // 2)
n, amin, amax = 0, 255, 0
while True:
    buf = dec.stdout.read(fs * 2 + cs * 2)
    if len(buf) < fs * 2 + cs * 2: break
    a = np.frombuffer(buf, np.uint8)
    Y = a[:fs].reshape(H, W).astype(np.float32)
    U = a[fs:fs + cs].reshape(H // 2, W // 2).astype(np.float32)
    V = a[fs + cs:fs + 2 * cs].reshape(H // 2, W // 2).astype(np.float32)
    A8 = a[fs + 2 * cs:].reshape(H, W)
    amin, amax = min(amin, int(A8.min())), max(amax, int(A8.max()))
    A = A8.astype(np.float32) / 255.0
    A2 = A.reshape(H // 2, 2, W // 2, 2).mean(axis=(1, 3))
    Yo = np.full((2 * H + P, W), 16, np.float32)
    Yo[:H] = 16 + (Y - 16) * A
    Yo[H + P:] = 16 + 219 * A
    Uo = np.full(((2 * H + P) // 2, W // 2), 128, np.float32); Vo = Uo.copy()
    Uo[:H // 2] = 128 + (U - 128) * A2
    Vo[:H // 2] = 128 + (V - 128) * A2
    enc.stdin.write(b"".join(np.clip(np.rint(x), 0, 255).astype(np.uint8).tobytes() for x in (Yo, Uo, Vo)))
    n += 1
enc.stdin.close(); enc.wait(); dec.wait()
print(f"{src} -> {dst}: {n} fotogrammi, alfa da {amin} a {amax}")
