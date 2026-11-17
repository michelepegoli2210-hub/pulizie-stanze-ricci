# I video di Sofia segretaria (v1, v2, v3 = lavora, parla, ascolta): quanto si muove da un fotogramma all'altro, dove sbatte gli
# occhi, e quanto sono lontani i capi dove si attaccano (l'ultimo fotogramma di uno e il primo del seguente).
#   python3 -I misura_segr.py v3 parla ascolta
#   python3 -I misura_segr.py --capi v3:239,v1:0 parla:239,parla:0 …
import sys, os, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import attacco as at   # attacco.py sta qui accanto
QUI = os.path.dirname(os.path.abspath(__file__)); SORG = f'{QUI}/out'
def leggi(k, i): return cv2.imread(f'{SORG}/{k}/f{i:04d}.png', cv2.IMREAD_UNCHANGED)
def rit(k, i):
    f = cv2.resize(leggi(k, i), (270, 480), interpolation=cv2.INTER_AREA).astype(np.float32); a = f[..., 3:4] / 255
    return f[..., :3] * a + 190 * (1 - a)
VISO = (slice(150, 400), slice(150, 400))     # il viso (nella foto: occhi a y 250 circa, bocca a y 325)
BOCCA = (slice(300, 350), slice(215, 320))
OCCHI = (slice(232, 275), slice(180, 345))
def pezzo(k, i, z):
    f = leggi(k, i)[z].astype(np.float32); a = f[..., 3:4] / 255
    return f[..., :3] * a + 190 * (1 - a)
def capi(ka, ia, kb, ib, zitto=False):
    A, Bf = leggi(ka, ia), leggi(kb, ib); dire = []
    F, err, buono = at.flusso_guidato(A, Bf, liscio=3.0, dire=dire)
    dentro = A[..., 3] > 128
    m = np.hypot(F[..., 0], F[..., 1])
    testa = np.zeros_like(dentro); testa[90:440, 120:430] = True; testa &= dentro
    h, w = F.shape[:2]; xx, yy = at.griglia(h, w)
    Bw = at.campiona(Bf.astype(np.float32), xx + F[..., 0], yy + F[..., 1])
    col = float(np.abs(Bw[..., :3] - A[..., :3].astype(np.float32))[A[..., 3] > 200].mean())
    vis = float(np.abs(Bw[VISO][..., :3] - A[VISO][..., :3].astype(np.float32)).mean())
    boc = float(np.abs(Bw[BOCCA][..., :3] - A[BOCCA][..., :3].astype(np.float32)).mean())
    r = dict(medio=float(m[dentro].mean()), p95=float(np.percentile(m[dentro], 95)), testa=float(np.percentile(m[testa], 95)), colore=col, viso=vis, bocca=boc)
    if not zitto: print(f"{ka}{ia} -> {kb}{ib}: spostamento medio {r['medio']:.1f}, 95% {r['p95']:.1f} px; testa 95% {r['testa']:.1f}; colore {col:.1f}; viso dopo l'allineamento {vis:.1f}; bocca {boc:.1f}; non sicuri {100 * float((~buono & dentro).sum()) / dentro.sum():.1f}%; {dire}", flush=True)
    return r

if __name__ == '__main__':
    if '--capi' in sys.argv:
        for c in [a for a in sys.argv[1:] if ':' in a]:
            (ka, ia), (kb, ib) = [(x.split(':')[0], int(x.split(':')[1])) for x in c.split(',')]
            capi(ka, ia, kb, ib)
        sys.exit(0)
    os.makedirs(f'{QUI}/log', exist_ok=True)
    for k in [a for a in sys.argv[1:] if not a.startswith('--')]:
        n = len([x for x in os.listdir(f'{SORG}/{k}') if x.endswith('.png')])
        R = [rit(k, i) for i in range(n)]; V = [pezzo(k, i, VISO) for i in range(n)]; O = [pezzo(k, i, OCCHI) for i in range(n)]; Bc = [pezzo(k, i, BOCCA) for i in range(n)]
        d = np.array([float(np.abs(R[i + 1] - R[i]).mean()) for i in range(n - 1)])
        dv = np.array([float(np.abs(V[i + 1] - V[i]).mean()) for i in range(n - 1)])
        print(f"== {k}: {n} fotogrammi; cambio medio {d.mean():.2f}, mediano {np.median(d):.2f}, massimo {d.max():.2f} (tra {int(d.argmax())} e {int(d.argmax()) + 1}); viso: medio {dv.mean():.2f}, massimo {dv.max():.2f} (tra {int(dv.argmax())} e {int(dv.argmax()) + 1})")
        for i in range(1, n - 2):
            vic = (d[i - 1] + d[i + 1]) / 2
            if d[i] > 0.9 and d[i] > 1.7 * vic: print(f"   passo doppio? tra {i} e {i + 1}: {d[i]:.2f} (i vicini {d[i - 1]:.2f} e {d[i + 1]:.2f})")
            if d[i] < 0.25 * vic and vic > 0.8: print(f"   fotogramma fermo? tra {i} e {i + 1}: {d[i]:.2f} (i vicini {d[i - 1]:.2f} e {d[i + 1]:.2f})")
        # rispetto al primo fotogramma (la posa della foto): tutta la figura, gli occhi, la bocca
        d0 = np.array([float(np.abs(R[i] - R[0]).mean()) for i in range(n)])
        o0 = np.array([float(np.abs(O[i] - O[0]).mean()) for i in range(n)])
        b0 = np.array([float(np.abs(Bc[i] - Bc[0]).mean()) for i in range(n)])
        print("   lontano dalla posa della foto (ogni 8): " + ' '.join(f"{i}:{d0[i]:.1f}" for i in range(0, n, 8)))
        print("   occhi diversi dal primo (ogni 4):       " + ' '.join(f"{i}:{o0[i]:.0f}" for i in range(0, n, 4)))
        print("   bocca diversa dal primo (ogni 4):       " + ' '.join(f"{i}:{b0[i]:.0f}" for i in range(0, n, 4)))
        print(f"   primo e ultimo fotogramma: differenza {float(np.abs(R[0] - R[-1]).mean()):.2f} (viso {float(np.abs(V[0] - V[-1]).mean()):.2f})")
        np.savez(f'{QUI}/log/cambi-{k}.npz', d=d, dv=dv, d0=d0, o0=o0, b0=b0)
