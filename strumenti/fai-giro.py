# I filmati di Sofia SENZA I PASSAGGI «DA ROBOT» (17/11/2026). Michele: «sofia governante fa ancora delle movenze che sembra un
# robot che si sposta, togli quello» e, del video che ha fatto lui con Gemini: «questo è il video di sofia che mi manda i baci
# ed è bellissimo».
# I «robot» erano i passaggi tra un pezzo e l'altro della 1.90.0: un secondo in cui la testa girava e scivolava tutta insieme.
# Qui non ce ne sono più. Ogni pezzo PARTE E FINISCE NELLA STESSA POSA, e ci arriva coi suoi fotogrammi veri:
#   - un pezzo che parte da quella posa e finisce altrove si fa andare AVANTI E POI ALL'INDIETRO (gli stessi fotogrammi, al
#     contrario): torna da solo dov'era partito. Si gira dove lei è quasi ferma, con un fotogramma di pausa;
#   - il video dei baci parte e finisce già nella posa della foto;
#   - dove si passa da un video a un altro i due fotogrammi sono quasi uguali (da 1 a 4 puntini di differenza): bastano da 2 a 6
#     fotogrammi fatti come nella 1.90.0 (attacco.py: solo coi due fotogrammi veri), e sono così piccoli che non si vedono.
#   - dove un video entra mentre lei si sta già muovendo (il pezzo in cui guarda di lato) i primi fotogrammi vanno più piano e
#     prendono velocità un po' alla volta (e alla fine rallentano): sono fotogrammi a metà tra due fotogrammi veri vicini, che
#     differiscono di meno di due puntini. Così non parte e non si ferma di colpo.
# «ferma» = [il saluto: sorride, saluta da Miss, manda il bacio] [calma: ferma, guarda di lato, torna] e da capo.
# «parla» = i 5 pezzi di prima, ognuno avanti e indietro; mentre parla l'app resta dentro un pezzo solo (FILM_GIRA in app.js),
#           quindi tra un pezzo e l'altro non si passa mai: dopo ogni pezzo c'è una coda uguale al suo inizio, per quando
#           l'app ci torna con un attimo di ritardo.
#   python3 -I fai_giro.py ferma parla [--solo-misure]
# Esce: giro/<gruppo>/f%04d.png (ritagliata, con la trasparenza), giro/<gruppo>-piatto/f%04d.png (con la sala), giro/<gruppo>.json
import sys, os, json, time, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import attacco as at   # attacco.py sta qui accanto

SORG = {'c': '/home/claude/dev/spilla/film/out/calmo',      # i due pezzi calmi di sempre (0..221 e 222..425), con la spilla
        'p': '/home/claude/dev/spilla/film/out/parla',      # i cinque pezzi in cui parla
        's': '/home/claude/dev/video1910/out/saluto'}       # il video dei baci (fatto da Michele con Gemini), ritagliato come gli altri
OUT = '/home/claude/dev/video1910/giro'
CODA = 12   # fotogrammi di coda dopo ogni pezzo di «parla» (mezzo secondo): l'app guarda il filmato ogni 150 millesimi

def firme(k):
    f = {'c': 'firme-calmo-vecchi.npy', 'p': 'firme-parla-vecchi.npy', 's': 'firme-saluto.npy'}[k]
    return np.load(os.path.join(os.path.dirname(os.path.abspath(__file__)), f))

def piu_fermo(k, da, a):
    """il fotogramma tra da e a (compresi) dove Sofia si muove di meno: lì si gira"""
    F = firme(k); v = np.abs(F[1:] - F[:-1]).mean(axis=(1, 2, 3)); vs = np.convolve(v, np.ones(5) / 5, mode='same')
    return int(da + np.argmin(vs[da:a + 1]))

RAMPA = [0.2, 0.3, 0.45, 0.6, 0.7, 0.85, 0.9]   # di quanto avanza a ogni fotogramma quando prende velocità (in tutto 4 fotogrammi veri)

def gruppi():
    ini = [piu_fermo('p', a, a + 10) for a in (0, 240, 443, 683, 888)]
    tp = [piu_fermo('p', b - 16, b - 3) for b in (240, 443, 683, 888, 1110)]
    return {
        # ogni passo: (da quale video, dal fotogramma, al fotogramma[, 'entra' | 'esce']) compresi; se il secondo numero è più
        # piccolo va all'indietro. 'entra': parte piano; 'esce': arriva piano.
        'ferma': dict(passo=0.45, tinta=0.8, pezzi=[
            dict(nome='saluto', passi=[('c', 24, 0), ('s', 0, 239), ('c', 0, 24)]),
            dict(nome='calma', passi=[('c', 24, 159), ('c', 358, 423, 'entra'), ('c', 423, 245), ('c', 245, 358, 'esce'), ('c', 159, 219), ('c', 219, 25)]),
        ]),
        'parla': dict(passo=0.45, tinta=0.8, pezzi=[dict(nome=f'parla {i + 1}', passi=[('p', a, f), ('p', f, a), ('p', a, a + CODA - 1)], coda=True) for i, (a, f) in enumerate(zip(ini, tp))]),
    }

def numeri(da, a, come=None):
    """i fotogrammi di un passo, in ordine (anche a metà tra due veri, quando parte o arriva piano)"""
    verso = 1 if a >= da else -1
    idx = [float(i) for i in range(da, a + verso, verso)]
    if come == 'entra' and len(idx) > 6: idx = [float(da)] + [da + verso * float(x) for x in np.cumsum(RAMPA)] + idx[5:]
    if come == 'esce' and len(idx) > 6: idx = idx[:-4] + [a - verso * (4 - float(x)) for x in np.cumsum(RAMPA[::-1])]
    return [round(x, 3) for x in idx], verso

def percorso(r, piatto=False): return f"{SORG[r[0]]}{'-piatto' if piatto else ''}/f{r[1]:04d}.png"
def leggi(r, piatto=False): return cv2.imread(percorso(r, piatto), cv2.IMREAD_UNCHANGED)

def sfondo_pulito(piatto, alfa):
    m = cv2.dilate((alfa > 2).astype(np.uint8), np.ones((9, 9), np.uint8))
    return cv2.inpaint(piatto, m * 255, 6, cv2.INPAINT_TELEA).astype(np.float32)

def tempi(n):
    out = []
    for j in range(1, n + 1):
        u = j / (n + 1)
        out.append((float(at.dolce(u)), float(at.dolce(min(1.0, max(0.0, (u - 0.18) / 0.64))))))
    return out

class Sorgente:
    def __init__(self, r):
        rgba = leggi(r); piatto = leggi(r, True)
        self.s = rgba.astype(np.float32)
        self.p = at.premoltiplica(rgba)
        self.bg = sfondo_pulito(piatto, rgba[..., 3])
        self.res = piatto.astype(np.float32) - (self.p[..., :3] + (1 - self.p[..., 3:4] / 255) * self.bg)

def fai(g, solo_misure=False):
    cfg = gruppi()[g]
    # --- 1. la fila dei fotogrammi veri, pezzo per pezzo, e dove servono gli attacchi
    fila = []        # ogni voce: dict(r=(video, numero), pezzo=i, coda=bool)
    attacchi = []    # dict(dopo=indice nella fila dell'ultimo fotogramma prima dell'attacco)
    segni = []       # per ogni pezzo: dove comincia nella fila e dove comincia la sua coda
    ultimo = None; verso_prima = 0
    for ip, pz in enumerate(cfg['pezzi']):
        inizio = len(fila); coda_da = None
        for ips, passo in enumerate(pz['passi']):
            k, da, a = passo[:3]
            idx, verso = numeri(da, a, passo[3] if len(passo) > 3 else None)
            ecoda = bool(pz.get('coda')) and ips == len(pz['passi']) - 1
            if ecoda: coda_da = len(fila)
            primo = (k, idx[0])
            if ultimo is not None:
                if ultimo == primo:
                    if verso == verso_prima and not ecoda: idx = idx[1:]   # si continua nello stesso verso: niente doppione
                    # se si gira (o è la coda) il fotogramma resta due volte: è la pausa
                elif not (pz.get('coda') and ips == 0):
                    attacchi.append(dict(dopo=len(fila) - 1))          # due fotogrammi diversi: serve l'attacco
                # (il primo passo di un pezzo di «parla» comincia dopo la coda del pezzo prima: lì l'app non passa mai)
            for i in idx: fila.append(dict(r=(k, i), pezzo=ip, coda=coda_da is not None))
            ultimo = (k, idx[-1]) if idx else ultimo; verso_prima = verso
        segni.append(dict(nome=pz['nome'], da=inizio, coda=coda_da))
    # il giro si chiude: dall'ultimo fotogramma si torna al primo (senza doppione, senza attacco se sono vicini di numero)
    # --- 2. le misure di ogni attacco
    for a_ in attacchi:
        ra, rb = fila[a_['dopo']]['r'], fila[a_['dopo'] + 1]['r']
        assert float(ra[1]).is_integer() and float(rb[1]).is_integer(), (ra, rb)
        ra, rb = (ra[0], int(ra[1])), (rb[0], int(rb[1]))
        A, B = leggi(ra), leggi(rb); t0 = time.time(); dire = []
        F, err, buono = at.flusso_guidato(A, B, liscio=3.0, dire=dire)
        dentro = A[..., 3] > 128; dentro[820:] = False
        m = np.hypot(F[..., 0], F[..., 1]); p95 = float(np.percentile(m[dentro], 95))
        # quanto cambia il colore (il video dei baci ha una tinta appena diversa): si misura dopo aver rimesso B sopra A
        h, w = F.shape[:2]; xx, yy = at.griglia(h, w)
        Bw = at.campiona(B.astype(np.float32), xx + F[..., 0], yy + F[..., 1])
        colore = float(np.abs(Bw[..., :3] - A[..., :3].astype(np.float32))[A[..., 3] > 200].mean())
        # attacchi minuscoli: tanti passi quanti ne servono perché a ogni fotogramma si sposti di meno di mezzo puntino e cambi
        # colore di pochissimo; il passo è sempre uguale (niente partenze e fermate: lo spostamento è già piccolo)
        n_int = int(min(12, max(3, round(p95 / cfg['passo']), int(np.ceil(colore / cfg['tinta']))))); n = n_int - 1
        lati = 0   # attacchi minuscoli: i fotogrammi veri accanto restano com'erano
        a_.update(da=list(ra), a=list(rb), passi=n, lati=lati, nuovi=n - 2 * lati, spostamento_95=round(p95, 1), spostamento_medio=round(float(m[dentro].mean()), 1), colore=round(colore, 1), note=dire, F=F)
        print(f"{g}: attacco {ra} -> {rb}: {n - 2 * lati} fotogrammi in più (spostamento medio {m[dentro].mean():.1f}, 95% {p95:.1f} px; colore {colore:.1f}) {dire} [{time.time() - t0:.0f} s]", flush=True)
    # --- 3. la fila di uscita: i veri, quelli veri appena spostati ai lati di un attacco, quelli nuovi
    usc = []   # dict(tipo='vero'|'M'|'N', r=…, att=…, j=…, pezzo, coda)
    per_dopo = {a_['dopo']: a_ for a_ in attacchi}
    for i, f in enumerate(fila):
        k, x = f['r']
        if float(x).is_integer(): usc.append(dict(tipo='vero', r=(k, int(x)), pezzo=f['pezzo'], coda=f['coda'], fila=i))
        else: usc.append(dict(tipo='M', r=(k, x), pezzo=f['pezzo'], coda=f['coda'], fila=i))
        if i in per_dopo:
            a_ = per_dopo[i]
            for j in range(1, a_['passi'] + 1): usc.append(dict(tipo='N', att=a_, j=j, pezzo=f['pezzo'], coda=f['coda'], fila=None))
    # --- 4. si scrive
    info = dict(gruppo=g, pezzi=[], attacchi=[{k: v for k, v in a_.items() if k != 'F'} for a_ in attacchi])
    for ip, s in enumerate(segni):
        da = next(k for k, u in enumerate(usc) if u['fila'] == s['da'])
        coda = next(k for k, u in enumerate(usc) if u['fila'] == s['coda']) if s['coda'] is not None else None
        info['pezzi'].append(dict(nome=s['nome'], da=da, coda=coda))
    for ip, pz in enumerate(info['pezzi']):
        pz['fine'] = info['pezzi'][ip + 1]['da'] if ip + 1 < len(info['pezzi']) else len(usc)
        if pz['coda'] is None: pz['coda'] = pz['fine']
    info['fine'] = len(usc); info['inizi'] = [p['da'] for p in info['pezzi']]; info['code'] = [p['coda'] for p in info['pezzi']]
    info['fotogrammi'] = [(list(u['r']) if u['tipo'] != 'N' else None) for u in usc]; info['tipi'] = ''.join(dict(vero='v', M='m', N='n')[u['tipo']] for u in usc)
    print(f"{g}: {len(usc)} fotogrammi ({len(usc) / 24:.2f} s), di cui veri {sum(u['tipo'] == 'vero' for u in usc)}, a metà tra due veri vicini {sum(u['tipo'] == 'M' for u in usc)}, degli attacchi {sum(u['tipo'] == 'N' for u in usc)}. Inizi dei pezzi {info['inizi']}, dove finiscono {info['code']}", flush=True)
    if solo_misure: return info
    for d in (f'{OUT}/{g}', f'{OUT}/{g}-piatto'):
        os.makedirs(d, exist_ok=True)
        for f in os.listdir(d): os.remove(os.path.join(d, f))
    def taglia(x): x[..., 3] = np.clip(x[..., 3], 0, 255); return np.clip(x, 0, 255)
    vicini = {}
    for k, u in enumerate(usc):
        if u['tipo'] == 'vero':
            for piatto in (False, True): os.link(percorso(u['r'], piatto), f"{OUT}/{g}{'-piatto' if piatto else ''}/f{k:04d}.png")
            continue
        if u['tipo'] == 'M':
            # a metà tra due fotogrammi veri vicini dello stesso video: i (prima) e i+1 (dopo), alla frazione fr
            kk, x = u['r']; i0 = int(np.floor(x)); fr = float(x - i0)
            ch = (kk, i0)
            if ch not in vicini:
                A, B = leggi((kk, i0)), leggi((kk, i0 + 1))
                Fv, _, _ = at.flusso_guidato(A, B, liscio=3.0)
                sa, sb = Sorgente((kk, i0)), Sorgente((kk, i0 + 1))
                if len(vicini) > 3: vicini.pop(next(iter(vicini)))
                vicini[ch] = (Fv, sa, sb, at.costo_di(sa.p, sb.p, Fv))
            F, sa, sb, costo = vicini[ch]; t = tc = fr
        else:
            a_ = u['att']
            if 'SA' not in a_:
                a_['SA'], a_['SB'] = Sorgente(tuple(a_['da'])), Sorgente(tuple(a_['a'])); a_['costo'] = at.costo_di(a_['SA'].p, a_['SB'].p, a_['F'])
            F, sa, sb, costo = a_['F'], a_['SA'], a_['SB'], a_['costo']; t = tc = u['j'] / (a_['passi'] + 1)
        h, w = F.shape[:2]; xx, yy = at.griglia(h, w)
        Ft = at.porta_a(F, t, costo)[0]
        ax, ay = xx - t * Ft[..., 0], yy - t * Ft[..., 1]; bx, by = xx + (1 - t) * Ft[..., 0], yy + (1 - t) * Ft[..., 1]
        fg = at.mescola_piena(taglia(at.campiona(sa.s, ax, ay)), taglia(at.campiona(sb.s, bx, by)), tc); al = fg[..., 3:4] / 255
        piatto = fg[..., :3] * al + (1 - al) * ((1 - tc) * sa.bg + tc * sb.bg) + (1 - tc) * at.campiona(sa.res, ax, ay) + tc * at.campiona(sb.res, bx, by)
        cv2.imwrite(f'{OUT}/{g}/f{k:04d}.png', at.a_png(fg))
        cv2.imwrite(f'{OUT}/{g}-piatto/f{k:04d}.png', np.clip(piatto + 0.5, 0, 255).astype(np.uint8))
    json.dump(info, open(f'{OUT}/{g}.json', 'w'), ensure_ascii=False, indent=1)
    print(f"{g}: FINITO", flush=True)
    return info

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for g in [a for a in sys.argv[1:] if not a.startswith('--')]:
        fai(g, '--solo-misure' in sys.argv)
