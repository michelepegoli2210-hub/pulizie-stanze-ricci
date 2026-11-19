# 1.104.0 · il «pacco» di Karen: uno zip SENZA compressione coi suoi quattro file (l'app lo legge da sé, karenZip).
# Resta FUORI dal sito e da GitHub: lo carica Michele sul suo telefono (Impostazioni → Altro → «Carica il file di Karen»).
#   python3 -I fai-pacco.py uscita.zip
import sys, zipfile, os
FILE = {"jv-lei-3d.webp": "/home/claude/dev/video19101/finiti/jv-lei-3d.webp",
        "jv-lei-viso.webp": "/home/claude/dev/video19101/finiti/jv-lei-viso.webp",
        "jv-lei-saluto-3d.webm": "/home/claude/dev/video19101/finiti/jv-lei-saluto-3d.webm",
        "jv-lei-parla-3d.webm": "/home/claude/dev/video19102/finiti/jv-lei-parla-3d.webm"}
out = sys.argv[1]
with zipfile.ZipFile(out, "w", compression=zipfile.ZIP_STORED) as z:
    for nome, da in FILE.items(): z.write(da, nome)
with zipfile.ZipFile(out) as z: print(out, os.path.getsize(out), [(i.filename, i.file_size, i.compress_type) for i in z.infolist()])
