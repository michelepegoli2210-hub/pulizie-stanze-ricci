# I filmati di Sofia segretaria col rosa (17/11/2026). Michele: «fai fare dei nuovi filmati dove sofia segretaria mentre sta ferma passa
# dal tablet al pc ed è impegnata a fare le mansioni di segreteria, fanne 3 video che facciano sembrare tutto consequenziale».
# I video (fatti da Gemini dalla foto col rosa, col verde dietro) partono e finiscono tutti nella posa della foto: si mettono in fila
# così come sono; tra la fine di uno e l'inizio dell'altro i due fotogrammi sono quasi uguali e bastano pochi fotogrammi di attacco.py
# (solo coi due fotogrammi veri). Solo ritagliati (senza sfondo): nell'app Sofia segretaria non ha una versione con lo sfondo.
#   python3 -I fai_segr.py            → giro/ferma/f%04d.png, giro/guarda/f%04d.png, giro/segr.json
import sys, os, json, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import attacco as at   # attacco.py sta qui accanto
QUI = os.path.dirname(os.path.abspath(__file__)); SORG = f'{QUI}/out'; OUT = f'{QUI}/giro'
def leggi(v, i): return cv2.imread(f'{SORG}/{v}/f{i:04d}.png', cv2.IMREAD_UNCHANGED)
def taglia(x): x[..., 3] = np.clip(x[..., 3], 0, 255); return np.clip(x, 0, 255)

def attacco(ra, rb, passo=0.45, tinta=0.8):
    """i fotogrammi tra ra (ultimo di un video) e rb (primo del video dopo)"""
    A, B = leggi(*ra), leggi(*rb)
    F, err, buono = at.flusso_pulito(A, B, liscio=3.0, scale=(4, 2, 1))
    dentro = A[..., 3] > 128
    m = np.hypot(F[..., 0], F[..., 1]); p95 = float(np.percentile(m[dentro], 95))
    h, w = F.shape[:2]; xx, yy = at.griglia(h, w)
    Bw = at.campiona(B.astype(np.float32), xx + F[..., 0], yy + F[..., 1])
    colore = float(np.abs(Bw[..., :3] - A[..., :3].astype(np.float32))[A[..., 3] > 200].mean())
    n = int(min(12, max(3, round(p95 / passo), int(np.ceil(colore / tinta))))) - 1
    sa, sb = A.astype(np.float32), B.astype(np.float32); costo = at.costo_di(at.premoltiplica(A), at.premoltiplica(B), F)
    out = []
    for j in range(1, n + 1):
        t = j / (n + 1); Ft = at.porta_a(F, t, costo)[0]
        ax, ay = xx - t * Ft[..., 0], yy - t * Ft[..., 1]; bx, by = xx + (1 - t) * Ft[..., 0], yy + (1 - t) * Ft[..., 1]
        out.append(at.a_png(at.mescola_piena(taglia(at.campiona(sa, ax, ay)), taglia(at.campiona(sb, bx, by)), t)))
    print(f"attacco {ra} -> {rb}: {n} fotogrammi in più (spostamento medio {m[dentro].mean():.1f}, 95% {p95:.1f} px; colore {colore:.1f})", flush=True)
    return out, dict(da=list(ra), a=list(rb), nuovi=n, spostamento_95=round(p95, 1), colore=round(colore, 1))

def scrivi(nome, voci):
    """voci: ('v', video, numero) fotogramma vero · ('n', immagine) fotogramma di un attacco"""
    d = f'{OUT}/{nome}'; os.makedirs(d, exist_ok=True)
    for f in os.listdir(d): os.remove(os.path.join(d, f))
    for k, v in enumerate(voci):
        if v[0] == 'v': os.link(f'{SORG}/{v[1]}/f{v[2]:04d}.png', f'{d}/f{k:04d}.png')
        else: cv2.imwrite(f'{d}/f{k:04d}.png', v[1])
    return len(voci)

if __name__ == '__main__':
    video = [v for v in ('v1', 'v2', 'v3') if os.path.isdir(f'{SORG}/{v}')]
    info = dict(video=video, attacchi=[], inizi=[])
    # «ferma»: i video uno dopo l'altro, e dall'ultimo di nuovo al primo
    voci = []
    for i, v in enumerate(video):
        info['inizi'].append(len(voci))
        nv = len([x for x in os.listdir(f'{SORG}/{v}') if x.endswith('.png')])
        voci += [('v', v, k) for k in range(nv)]
        dopo = video[(i + 1) % len(video)]
        nuovi, a = attacco((v, nv - 1), (dopo, 0)); info['attacchi'].append(a)
        voci += [('n', im) for im in nuovi]
    info['ferma'] = scrivi('ferma', voci)
    # «guarda»: ti guarda e sorride (gli ultimi 2 secondi e mezzo del primo video, avanti e indietro, girando dov'è più ferma):
    # per quando ti ascolta e, finché non c'è il video in cui parla, per quando parla
    F = np.stack([cv2.resize(leggi('v1', k)[..., :3], (54, 96), interpolation=cv2.INTER_AREA).astype(np.float32) for k in range(170, 240)])
    vel = np.abs(F[1:] - F[:-1]).mean(axis=(1, 2, 3)); vs = np.convolve(vel, np.ones(5) / 5, mode='same')
    a = 170 + int(np.argmin(vs[8:22])) + 8; b = 170 + int(np.argmin(vs[52:66])) + 52
    info['guarda_da'], info['guarda_a'] = a, b
    idx = list(range(a, b + 1)) + list(range(b, a - 1, -1))
    info['guarda'] = scrivi('guarda', [('v', 'v1', k) for k in idx])
    # «parla»: il video in cui parla (parte e finisce nella posa della foto): gira su se stesso finché parla
    if os.path.isdir(f'{SORG}/parla'):
        npa = len([x for x in os.listdir(f'{SORG}/parla') if x.endswith('.png')])
        nuovi, a = attacco(('parla', npa - 1), ('parla', 0)); info['attacchi'].append(a)
        info['parla'] = scrivi('parla', [('v', 'parla', k) for k in range(npa)] + [('n', im) for im in nuovi])
    json.dump(info, open(f'{OUT}/segr.json', 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in info.items() if k != 'attacchi'}, ensure_ascii=False), flush=True)
