# I filmati di Sofia SENZA SCATTI (16/11/2026). Michele: «mi piace di più come adesso… queste movenze qui… l'unica cosa
# che non mi piace è che sono dei video separati, quindi fa scatti». E della Sofia rifatta da Flow: «la mia Sofia… è molto
# più bella, ha gli occhi molto più magnetici… lì già gli occhi sono storti».
# Quindi: i pezzi veri restano TUTTI, interi, com'erano (stessi fotogrammi). Tra la fine di un pezzo e l'inizio del pezzo
# dopo (e tra l'ultimo e il primo, dove il filmato ricomincia) si aggiunge meno di un secondo in cui Sofia passa da una
# posa all'altra: è fatto solo coi due fotogrammi veri (attacco.py), niente è ridisegnato da una macchina.
#   python3 -I fai_fluido.py calmo|parla [--solo-misure]
# Esce: out/<gruppo>/f%04d.png (ritagliata, con la trasparenza), out/<gruppo>-piatto/f%04d.png (con la sala) e out/<gruppo>.json
import sys, os, json, time, numpy as np, cv2
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); import attacco as at   # attacco.py sta qui accanto

SORG = '/home/claude/dev/spilla/film/out'
OUT = '/home/claude/dev/video1900/out'
GRUPPI = {
    # tagli: dove comincia ogni pezzo (più la fine); vmax: la velocità più alta ammessa nell'attacco (pixel per fotogramma)
    # 1.90.2: «ferma» comincia e ricomincia dal fotogramma 24 del pezzo 1 (prima da 0: lì ha il sorriso grande coi denti della
    # foto e in mezzo secondo lo perde; a ogni giro «sorride e torna di colpo seria»). I primi 24 fotogrammi non si usano più.
    'calmo': dict(tagli=[24, 222, 426], vmax=2.0, minimo=16, massimo=26),
    'parla': dict(tagli=[0, 240, 443, 683, 888, 1110], vmax=3.0, minimo=12, massimo=24),
}

def leggi(g, i, piatto=False):
    return cv2.imread(f'{SORG}/{g}{"-piatto" if piatto else ""}/f{i:04d}.png', cv2.IMREAD_UNCHANGED)

def sfondo_pulito(piatto, alfa):
    """la sala senza Sofia (per quel fotogramma): dove c'è lei si continua lo sfondo che le sta intorno. Serve solo per la
    striscia sottile che si scopre mentre lei si sposta."""
    m = cv2.dilate((alfa > 2).astype(np.uint8), np.ones((9, 9), np.uint8))
    return cv2.inpaint(piatto, m * 255, 6, cv2.INPAINT_TELEA).astype(np.float32), m.astype(bool)

def tempi(n):
    """per gli n fotogrammi aggiunti: t = quanto si è spostata (parte e arriva piano), tc = quanto è passato il colore
    (comincia un po' dopo e finisce un po' prima: così il viso resta nitido più a lungo)"""
    out = []
    for j in range(1, n + 1):
        u = j / (n + 1)
        out.append((float(at.dolce(u)), float(at.dolce(min(1.0, max(0.0, (u - 0.18) / 0.64))))))
    return out

class Sorgente:
    """un fotogramma vero pronto per l'attacco: ritaglio premoltiplicato, piatto, sala senza di lei, e quello che manca per
    tornare esattamente al fotogramma vero (ai bordi morbidi)"""
    def __init__(self, g, i):
        rgba = leggi(g, i); piatto = leggi(g, i, True)
        self.s = rgba.astype(np.float32)                 # il colore pieno (fuori da lei continua coi suoi colori) e la trasparenza
        self.p = at.premoltiplica(rgba)
        self.bg, _ = sfondo_pulito(piatto, rgba[..., 3])
        self.res = piatto.astype(np.float32) - (self.p[..., :3] + (1 - self.p[..., 3:4] / 255) * self.bg)

def fai(g, solo_misure=False):
    cfg = GRUPPI[g]; tagli = cfg['tagli']; n_pezzi = len(tagli) - 1
    # --- 1. le misure di ogni attacco: dall'ultimo fotogramma del pezzo p al primo del pezzo dopo (dopo l'ultimo: il primo)
    att = []
    for p in range(n_pezzi):
        ia, ib = tagli[p + 1] - 1, tagli[(p + 1) % n_pezzi]
        A, B = leggi(g, ia), leggi(g, ib); t0 = time.time(); dire = []
        F, err, buono = at.flusso_guidato(A, B, liscio=3.0, dire=dire)
        dentro = A[..., 3] > 128; dentro[820:] = False            # in fondo (sotto i gomiti) non conta per la durata
        m = np.hypot(F[..., 0], F[..., 1]); p95 = float(np.percentile(m[dentro], 95))
        n_int = int(min(cfg['massimo'], max(cfg['minimo'], round(p95 * 1.875 / cfg['vmax']))))
        n = n_int - 1
        # i primi e gli ultimi fotogrammi dell'attacco (dove lo spostamento è ancora quasi zero) si fanno coi fotogrammi veri
        # che SCORRONO (gli ultimi del pezzo prima, i primi del pezzo dopo): così Sofia non si ferma mai di colpo
        lati = int(min(4, np.floor(0.18 * n_int)))
        att.append(dict(dopo_pezzo=p + 1, da=ia, a=ib, passi=n, lati=lati, nuovi=n - 2 * lati, secondi=round(n_int / 24, 2), spostamento_95=round(p95, 1),
                        non_sicuri=round(100 * float((~buono & dentro).sum()) / max(1, int(dentro.sum())), 1), note=dire, F=F))
        print(f'{g}: attacco dopo il pezzo {p + 1} ({ia} -> {ib}): {n} passi ({att[-1]["secondi"]} s), di cui {n - 2 * lati} fotogrammi in più; spostamento 95% {p95:.1f} px, {dire}  [{time.time() - t0:.1f} s]', flush=True)
    # --- 2. il filmato: [inizio del pezzo 1, ritoccato dall'ultimo attacco] [pezzo 1] [attacco 1] [pezzo 2] … [ultimo attacco]
    for d in (f'{OUT}/{g}', f'{OUT}/{g}-piatto'):
        os.makedirs(d, exist_ok=True)
        for f in os.listdir(d): os.remove(os.path.join(d, f))
    k_out = 0; info = dict(gruppo=g, pezzi=[], attacchi=[])
    def copia(i):
        nonlocal k_out
        if not solo_misure:
            for suff in ('', '-piatto'): os.link(f'{SORG}/{g}{suff}/f{i:04d}.png', f'{OUT}/{g}{suff}/f{k_out:04d}.png')
        k_out += 1
    def scrivi(fg, piatto):
        nonlocal k_out
        cv2.imwrite(f'{OUT}/{g}/f{k_out:04d}.png', at.a_png(fg))
        cv2.imwrite(f'{OUT}/{g}-piatto/f{k_out:04d}.png', np.clip(piatto + 0.5, 0, 255).astype(np.uint8))
        k_out += 1
    def passo(a_, j, lato):
        """il fotogramma numero j (1..passi) dell'attacco a_. lato: 'A' (ultimi veri del pezzo prima), 'N' (nuovo), 'B' (primi veri del pezzo dopo)"""
        n, lati, F = a_['passi'], a_['lati'], a_['F']
        t, tc = tempi(n)[j - 1]
        if lato == 'A': sa, sb, tc = Sorgente(g, a_['da'] - lati + j), None, 0.0
        elif lato == 'B': sa, sb, tc = None, Sorgente(g, a_['a'] + j - (n - lati) - 1), 1.0
        else: sa, sb = a_['SA'], a_['SB']
        h, w = F.shape[:2]; xx, yy = at.griglia(h, w)
        Ft = at.porta_a(F, t, a_['costo'])[0]
        ax, ay = xx - t * Ft[..., 0], yy - t * Ft[..., 1]; bx, by = xx + (1 - t) * Ft[..., 0], yy + (1 - t) * Ft[..., 1]
        def taglia(x): x[..., 3] = np.clip(x[..., 3], 0, 255); return np.clip(x, 0, 255)
        if lato == 'A':
            fg = taglia(at.campiona(sa.s, ax, ay)); al = fg[..., 3:4] / 255
            piatto = fg[..., :3] * al + (1 - al) * sa.bg + at.campiona(sa.res, ax, ay)
        elif lato == 'B':
            fg = taglia(at.campiona(sb.s, bx, by)); al = fg[..., 3:4] / 255
            piatto = fg[..., :3] * al + (1 - al) * sb.bg + at.campiona(sb.res, bx, by)
        else:
            fg = at.mescola_piena(taglia(at.campiona(sa.s, ax, ay)), taglia(at.campiona(sb.s, bx, by)), tc); al = fg[..., 3:4] / 255
            piatto = fg[..., :3] * al + (1 - al) * ((1 - tc) * sa.bg + tc * sb.bg) + (1 - tc) * at.campiona(sa.res, ax, ay) + tc * at.campiona(sb.res, bx, by)
        scrivi(fg, piatto)
    def prepara(a_):
        if 'SA' not in a_ and not solo_misure:
            a_['SA'], a_['SB'] = Sorgente(g, a_['da']), Sorgente(g, a_['a'])
            a_['costo'] = at.costo_di(a_['SA'].p, a_['SB'].p, a_['F'])
    for p in range(n_pezzi):
        prima, dopo = att[(p - 1) % n_pezzi], att[p]         # l'attacco che porta a questo pezzo e quello che lo lascia
        a, b = tagli[p], tagli[p + 1]
        inizio = k_out
        # i primi fotogrammi del pezzo: sono gli ultimi passi dell'attacco che ci arriva (veri, spostati di meno di un pixel)
        prepara(prima)
        for j in range(prima['passi'] - prima['lati'] + 1, prima['passi'] + 1):
            if solo_misure: k_out += 1
            else: passo(prima, j, 'B')
        for i in range(a + prima['lati'], b - dopo['lati']): copia(i)
        # gli ultimi fotogrammi del pezzo: i primi passi dell'attacco che lo lascia
        prepara(dopo)
        for j in range(1, dopo['lati'] + 1):
            if solo_misure: k_out += 1
            else: passo(dopo, j, 'A')
        coda = k_out
        for j in range(dopo['lati'] + 1, dopo['passi'] - dopo['lati'] + 1):
            if solo_misure: k_out += 1
            else: passo(dopo, j, 'N')
        info['pezzi'].append(dict(da=inizio, coda=coda, fine=k_out, vecchio_da=a, vecchio_a=b))
        info['attacchi'].append({k: v for k, v in dopo.items() if k not in ('F', 'SA', 'SB', 'costo')} | dict(primo_nuovo=coda, ultimo_nuovo=k_out - 1))
        if not solo_misure and p > 0: prima.pop('SA', None); prima.pop('SB', None)
        print(f'{g}: pezzo {p + 1} fatto ({inizio}..{k_out - 1})', flush=True)
    info['fine'] = k_out
    info['inizi'] = [p['da'] for p in info['pezzi']]
    info['code'] = [p['coda'] for p in info['pezzi']]
    json.dump(info, open(f'{OUT}/{g}.json', 'w'), ensure_ascii=False, indent=1)
    print(f'{g}: FINITO, {k_out} fotogrammi ({k_out / 24:.2f} s; prima {tagli[-1]} = {tagli[-1] / 24:.2f} s). Inizi dei pezzi: {info["inizi"]}; dove finiscono i fotogrammi veri: {info["code"]}', flush=True)

if __name__ == '__main__':
    for g in [a for a in sys.argv[1:] if not a.startswith('--')]:
        fai(g, '--solo-misure' in sys.argv)
