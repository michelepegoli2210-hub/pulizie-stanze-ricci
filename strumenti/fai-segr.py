# I filmati di Sofia segretaria col rosa (segr7, 17/11/2026, per la 1.94.0). Michele: «fai fare dei nuovi filmati dove sofia
# segretaria mentre sta ferma passa dal tablet al pc ed è impegnata a fare le mansioni di segreteria, fanne 3 video che facciano
# sembrare tutto consequenziale». Adesso i video sono cinque (fatti da Flow dalla foto col rosa, col verde dietro, 10 secondi l'uno):
#   v1, v2, v3 = lavora (il tablet; il computer; il tablet e l'auricolare) · ascolta = ti guarda e ti ascolta · parla = parla
# Partono e finiscono tutti nella posa della foto (misurato con misura_segr.py: meno di un puntino di differenza): si mettono in
# fila così come sono; tra la fine di uno e l'inizio dell'altro bastano due fotogrammi di attacco.py (solo coi due fotogrammi veri).
# Tutti in avanti: nessun pezzo va all'indietro. Solo ritagliati (senza sfondo): nell'app Sofia segretaria non ha lo sfondo.
#   - da ferma: v1, v2, v3 e di nuovo v1 (30 secondi)
#   - ti ascolta: il video in cui ascolta, che gira su se stesso (10 secondi)
#   - parla: il video in cui parla, FINO AL FOTOGRAMMA 194. Dopo, nel video, chiude la bocca e resta ferma col sorriso a labbra
#     chiuse per due secondi: attaccato all'inizio (il sorriso coi denti della foto) avrebbe fatto «spuntare» i denti di colpo.
#     Al fotogramma 194 ha appena finito di parlare ed è già tornata nella posa della foto, col sorriso coi denti: lì gira.
#   python3 -I fai_segr.py            → giro/ferma, giro/ascolta, giro/parla (f%04d.png) e giro/segr.json
import sys, os, json, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import attacco as at   # attacco.py sta qui accanto
QUI = os.path.dirname(os.path.abspath(__file__)); SORG = f'{QUI}/out'; OUT = f'{QUI}/giro'
def leggi(v, i): return cv2.imread(f'{SORG}/{v}/f{i:04d}.png', cv2.IMREAD_UNCHANGED)
def taglia(x): x[..., 3] = np.clip(x[..., 3], 0, 255); return np.clip(x, 0, 255)

def attacco(ra, rb, passo=0.45, tinta=0.3):
    """i fotogrammi tra ra (ultimo di un video) e rb (primo del video dopo).
    tinta: quanti livelli di colore (in media) possono cambiare da un fotogramma all'altro. I due fotogrammi sono nello stesso
    posto ma la grana del video è diversa (2 livelli circa): con due soli fotogrammi in mezzo (com'era nei segr6) la grana cambiava
    in un ottavo di secondo, un piccolo tremolio proprio mentre lei è ferma; con sei cambia piano e non si vede."""
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

FERMA = ['v1', 'v2', 'v3']                                   # in fila, e dall'ultimo di nuovo al primo
GIRI = {'ascolta': ('ascolta', 239), 'parla': ('parla', 194)}   # nome del filmato: (video, ultimo fotogramma che si tiene)

if __name__ == '__main__':
    video = [v for v in FERMA if os.path.isdir(f'{SORG}/{v}')]
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
    # «ascolta» e «parla»: un video solo, che gira su se stesso (dall'ultimo fotogramma che si tiene di nuovo al primo)
    for nome, (v, ultimo) in GIRI.items():
        if not os.path.isdir(f'{SORG}/{v}'): continue
        nuovi, a = attacco((v, ultimo), (v, 0)); info['attacchi'].append(a)
        info[nome] = scrivi(nome, [('v', v, k) for k in range(ultimo + 1)] + [('n', im) for im in nuovi])
        info[nome + '_veri'] = ultimo + 1
    json.dump(info, open(f'{OUT}/segr.json', 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({k: v for k, v in info.items() if k != 'attacchi'}, ensure_ascii=False), flush=True)
