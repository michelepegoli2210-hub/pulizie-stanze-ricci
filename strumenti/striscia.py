# Una striscia: per ogni fotogramma, il piatto (con la sala) e accanto la sagoma (la parte trasparente tinta di verde), ritagliati su una zona.
#   python3 -I striscia.py <piatti> <ritagli> x0,y0,x1,y1 f1,f2,… uscita [<altri ritagli>]
import sys, numpy as np, cv2
PIA, RIT, zona, quali, out = sys.argv[1], sys.argv[2], [int(v) for v in sys.argv[3].split(',')], [int(v) for v in sys.argv[4].split(',')], sys.argv[5]
ALTRI = sys.argv[6:]
x0, y0, x1, y1 = zona; Z = 3
def tinta(p, a):
    al = a[..., None]; return (p * al + (p * 0.35 + np.array([0, 200, 0], np.float32) * 0.65) * (1 - al)).astype(np.uint8)
righe = []
for t in quali:
    p = cv2.imread(f'{PIA}/f{t:04d}.png', cv2.IMREAD_COLOR).astype(np.float32)[y0:y1, x0:x1]
    pezzi = [p.astype(np.uint8)]
    for D in [RIT] + ALTRI:
        a = cv2.imread(f'{D}/f{t:04d}.png', cv2.IMREAD_UNCHANGED)[y0:y1, x0:x1, 3].astype(np.float32) / 255
        pezzi.append(tinta(p, a))
    pezzi = [cv2.resize(q, None, fx=Z, fy=Z, interpolation=cv2.INTER_NEAREST) for q in pezzi]
    riga = np.concatenate([np.pad(q, ((2, 2), (2, 2), (0, 0)), constant_values=255) for q in pezzi], axis=1)
    cv2.putText(riga, str(t), (6, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    righe.append(riga)
cv2.imwrite(out, np.concatenate(righe, axis=0)); print(out, righe[0].shape, len(righe))
