#!/bin/bash
# 1.94.0 · I FILMATI SENZA IL «BATTITO». Fin qui i filmati avevano un fotogramma chiave ogni due secondi (-g 48; i gemelli per
# l'iPhone ogni secondo). Un fotogramma chiave è rifatto tutto da capo: in quel momento la grana di tutta la figura cambia insieme
# (misurato con misura-chiave.py: dove lei è ferma il cambio è 1,07 contro 0,09 dei fotogrammi vicini), e si vede soprattutto nei
# capelli: un tremolio piccolo a ogni due secondi. Adesso i fotogrammi chiave stanno SOLO dove servono: all'inizio del filmato e
# dove comincia ogni pezzo (l'app ci salta). I fotogrammi sono gli stessi di prima: cambia solo come sono compressi.
# Nomi nuovi (la cache dei filmati va per nome): segr7 (Sofia segretaria), -giro5 (la Sofia di casa, da ferma e quando parla).
# Senza i fotogrammi chiave in mezzo i file vengono più piccoli: lo spazio risparmiato è speso in qualità (crf 32 invece di 35,
# 34 invece di 36 dove parla; i piatti 20 e 21 invece di 21 e 21,5; i gemelli 22 invece di 23). Misurato sui fotogrammi veri: la
# figura adesso è un po' più fedele di prima (errore medio 1,28 contro 1,32) e i file pesano circa uguale. Tutti sotto i 10 MB.
#   bash codifica5.sh [segr] [ferma] [parla]      (senza niente: tutti)
set -e
QUI=/home/claude/dev/liscio1940; F=$QUI/finiti; mkdir -p "$F"
ALFA="python3 -I $QUI/fa-alfa.py"
V9="-c:v libvpx-vp9 -pix_fmt yuva420p -b:v 0 -row-mt 1 -deadline good -cpu-used 2 -auto-alt-ref 0 -g 9999 -an"
X4="-c:v libx264 -pix_fmt yuv420p -preset slow -g 9999 -sc_threshold 0 -movflags +faststart -an"
chiavi() { python3 -c "import json; d=json.load(open('$1')); print(','.join('%.6f' % max(0, i / 24 - 0.002) for i in d['inizi']))"; }
COSA="${*:-segr ferma parla}"
if [[ " $COSA " == *" segr "* ]]; then
  # Sofia segretaria: un solo fotogramma chiave per filmato, il primo (l'app dentro questi filmati salta solo all'inizio). Così
  # non c'è nessun «battito», e dove il filmato ricomincia non si vede niente: finisce nella stessa immagine da cui parte.
  O=/home/claude/dev/segr1910/giro
  ffmpeg -v error -y -framerate 24 -i "$O/ferma/f%04d.png" $V9 -crf 32 "$F/segr7-riposo-3d.webm" &
  ffmpeg -v error -y -framerate 24 -i "$O/ascolta/f%04d.png" $V9 -crf 32 "$F/segr7-ascolta-3d.webm"
  ffmpeg -v error -y -framerate 24 -i "$O/parla/f%04d.png" $V9 -crf 32 "$F/segr7-parla-3d.webm"
  wait
  $ALFA "$F/segr7-riposo-3d.webm" "$F/segr7-riposo-alfa.mp4" 22 9999 0
  $ALFA "$F/segr7-ascolta-3d.webm" "$F/segr7-ascolta-alfa.mp4" 22 9999 0
  $ALFA "$F/segr7-parla-3d.webm" "$F/segr7-parla-alfa.mp4" 22 9999 0
  echo "segr: fatto"
fi
if [[ " $COSA " == *" ferma "* ]]; then
  O=/home/claude/dev/flow1930/giro; KR=$(chiavi $O/ferma.json); echo "ferma, chiavi: $KR"
  ffmpeg -v error -y -framerate 24 -i "$O/ferma/f%04d.png" $V9 -crf 32 -force_key_frames "$KR" "$F/cons-riposo-spilla-giro5-3d.webm" &
  ffmpeg -v error -y -framerate 24 -i "$O/ferma-piatto/f%04d.png" $X4 -crf 20 -force_key_frames "$KR" "$F/cons-riposo-spilla-giro5.mp4"
  wait
  $ALFA "$F/cons-riposo-spilla-giro5-3d.webm" "$F/cons-riposo-spilla-giro5-alfa.mp4" 22 9999 "$KR"
  echo "ferma: fatto"
fi
if [[ " $COSA " == *" parla "* ]]; then
  O=/home/claude/dev/video1910/giro; KP=$(chiavi $O/parla.json); echo "parla, chiavi: $KP"
  ffmpeg -v error -y -framerate 24 -i "$O/parla/f%04d.png" $V9 -crf 34 -force_key_frames "$KP" "$F/cons-parla-spilla-giro5-3d.webm" &
  ffmpeg -v error -y -framerate 24 -i "$O/parla-piatto/f%04d.png" $X4 -crf 21 -force_key_frames "$KP" "$F/cons-parla-spilla-giro5.mp4"
  wait
  $ALFA "$F/cons-parla-spilla-giro5-3d.webm" "$F/cons-parla-spilla-giro5-alfa.mp4" 22 9999 "$KP"
  echo "parla: fatto"
fi
for f in "$F"/*.webm "$F"/*.mp4; do echo "$(basename $f) $(stat -c %s $f) byte, $(ffprobe -v error -show_entries format=duration -of csv=p=0 $f) s, $(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 $f) fotogrammi"; done
echo FINITO
