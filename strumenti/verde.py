# Sofia segretaria col rosa: togliere il verde (17/11/2026). Le foto e i video nuovi hanno dietro un verde tinta unita, chiesto
# apposta a Gemini: così si ritaglia tenendo TUTTO quello che non è verde (lei, il tablet, il bancone, il campanello, lo schermo del
# computer e la tastiera), cosa che la maschera «persona» (u2net_human_seg) degli altri filmati non sa fare.
#   ritaglia(rgb uint8 HxWx3) -> rgba uint8 HxWx4 (colore già ripulito dal verde ai bordi)
import numpy as np, cv2

def ritaglia(rgb, t0=18.0, t1=62.0):
    f = rgb.astype(np.float32)
    r, g, b = f[..., 0], f[..., 1], f[..., 2]
    eccesso = g - np.maximum(r, b)                     # quanto il verde supera gli altri due colori: tanto = sfondo
    a = 1.0 - np.clip((eccesso - t0) / (t1 - t0), 0, 1)
    # le briciole: puntini trasparenti minuscoli DENTRO di lei (rumore) si richiudono; i buchi veri (tra braccio e fianco) restano
    duro = (a > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(1 - duro, connectivity=4)
    minimo = max(12, int(0.00002 * duro.size))
    for k in range(1, n):
        if st[k, cv2.CC_STAT_AREA] < minimo: a[lab == k] = 1.0
    # e i pezzetti pieni staccati nello sfondo (rumore del video) spariscono
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8), connectivity=8)
    for k in range(1, n2):
        if st2[k, cv2.CC_STAT_AREA] < 0.0008 * duro.size: a[lab2 == k] = 0.0
    a = cv2.GaussianBlur(a, (0, 0), 0.6)
    # il colore: dove c'è ancora verde di troppo (riflessi) lo riporto al livello degli altri due; sul bordo (dove il colore è un
    # misto di lei e del verde) di più: lì il verde torna a metà tra il rosso e il blu, come nei capelli e nella giacca
    lim = np.maximum(r, b) + 4
    g2 = np.where(g > lim, lim, g)
    bordo = cv2.dilate(((a < 0.98)).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    meta = (r + b) * 0.5 * 1.04
    g2 = np.where(bordo & (g2 > meta), meta, g2)
    out = np.dstack([r, g2, b, a * 255])
    return np.clip(out + 0.5, 0, 255).astype(np.uint8)

if __name__ == "__main__":
    import sys
    from PIL import Image
    im = np.asarray(Image.open(sys.argv[1]).convert("RGB"))
    rgba = ritaglia(im)
    Image.fromarray(rgba, "RGBA").save(sys.argv[2])
    print(sys.argv[2], rgba.shape, "trasparente:", round(100 * float((rgba[..., 3] == 0).mean()), 1), "% · pieno:", round(100 * float((rgba[..., 3] == 255).mean()), 1), "% · mezzi:", round(100 * float(((rgba[..., 3] > 0) & (rgba[..., 3] < 255)).mean()), 2), "%")
