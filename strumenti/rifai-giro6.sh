#!/bin/bash
# 1.95.0 · IL FILMATO IN CUI STA FERMA SENZA I LAMPI NEL RITAGLIO (-giro6). Tutto da capo, in fila:
#  1) i quattro ritagli coi buchi sbagliati chiusi (liscia-bordo.py), dai ritagli della 1.93.0 (i «piatti» con la sala sono gli stessi);
#  2) gli stessi quattro rientri lenti della 1.93.0 (rientra.py) e lo stesso giro (fai-giro.py);
#  3) la stessa codifica senza il battito della 1.94.0 (codifica-liscia.sh): fotogrammi chiave solo dove comincia un pezzo.
# Alla fine: conta-lampi.py per vedere che i lampi sono spariti e non ce ne sono di nuovi.
# (Com'è stato fatto, con le cartelle di lavoro: qui i nomi sono liscia-bordo.py, conta-lampi.py, rientra.py, fai-giro.py.)
set -e
cd /home/claude/dev/flow1950
V=/home/claude/dev/flow1930/oro
python3 -I liscia_bordo.py /home/claude/dev/spilla2/saluto-oro oro/saluto-piatto oro/saluto > log/liscia-saluto.log 2>&1
python3 -I liscia_bordo.py $V/capelli oro/capelli-piatto oro/capelli > log/liscia-capelli.log 2>&1
python3 -I liscia_bordo.py $V/ferma oro/ferma-piatto oro/ferma > log/liscia-ferma.log 2>&1
python3 -I liscia_bordo.py $V/lato oro/lato-piatto oro/lato > log/liscia-lato.log 2>&1
echo "RITAGLI FATTI"
python3 -I rientra.py l 239 s 0 124 156 lato-rientra
python3 -I rientra.py k 206 f 29 146 190 capelli-rientra
python3 -I rientra.py f 232 l 10 168 232 ferma-rientra
python3 -I rientra.py s 239 k 2 196 239 saluto-rientra
python3 -I fai_giro4.py ferma
echo "GIRO FATTO"
O=/home/claude/dev/flow1950/giro; F=/home/claude/dev/flow1950/finiti; mkdir -p "$F"
KR=$(python3 -c "import json; d=json.load(open('$O/ferma.json')); print(','.join('%.6f' % max(0, i / 24 - 0.002) for i in d['inizi']))"); echo "chiavi ferma: $KR"
ffmpeg -v error -y -framerate 24 -i "$O/ferma/f%04d.png" -c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -auto-alt-ref 0 -g 9999 -an -crf 32 -force_key_frames "$KR" "$F/cons-riposo-spilla-giro6-3d.webm" &
ffmpeg -v error -y -framerate 24 -i "$O/ferma-piatto/f%04d.png" -c:v libx264 -pix_fmt yuv420p -preset slow -g 9999 -sc_threshold 0 -movflags +faststart -an -crf 20 -force_key_frames "$KR" "$F/cons-riposo-spilla-giro6.mp4"
wait
python3 -I /home/claude/dev/liscio1940/fa-alfa.py "$F/cons-riposo-spilla-giro6-3d.webm" "$F/cons-riposo-spilla-giro6-alfa.mp4" 22 9999 "$KR"
for f in "$F"/*.webm "$F"/*.mp4; do echo "$(basename $f) $(stat -c %s $f) byte, $(ffprobe -v error -show_entries format=duration -of csv=p=0 $f) s, $(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $f) fotogrammi"; done
python3 -I lampi.py oro/saluto-piatto /home/claude/dev/spilla2/saluto-oro oro/saluto
python3 -I lampi.py oro/capelli-piatto $V/capelli oro/capelli
echo FINITO
