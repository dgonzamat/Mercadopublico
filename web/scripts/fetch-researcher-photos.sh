#!/usr/bin/env bash
#
# fetch-researcher-photos.sh
# --------------------------
# Descarga retratos de FOTO LIBRE (PD/CC) de Wikimedia Commons para los
# investigadores que aún muestran avatar de iniciales, y los deja en
# web/public/researchers/<id>.jpg — el mismo lugar y nombre que ya usan
# luna.jpg y burchett.jpg.
#
# POR QUÉ EXISTE: el entorno de Claude Code on the web solo alcanza GitHub;
# upload.wikimedia.org devuelve 403. Este script está pensado para correrse
# desde una máquina/entorno con red abierta a Wikimedia. Tras correrlo:
#   1. revisa cada imagen (las marcadas "VERIFICAR" necesitan confirmar
#      licencia y/o recorte — p.ej. la de Hynek es una foto grupal),
#   2. agrega a data/researchers.json los campos photo/photo_credit/
#      photo_license (al final el script imprime el snippet listo para pegar).
#
# Uso:   bash scripts/fetch-researcher-photos.sh
# Requiere: curl, file
#
# Fuente de licencias: manifiesto de WebSearch sobre Wikimedia Commons.
# Las licencias CC exigen atribución → se rellenan en photo_credit.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1   # → web/
OUT="public/researchers"
mkdir -p "$OUT"

# id | Archivo en Commons | licencia | crédito/atribución | nota
ENTRIES=(
  # ── Confirmadas libres ──────────────────────────────────────────────
  "loeb|AviLoeb15.jpg|CC BY-SA 4.0|Avi Loeb / Wikimedia Commons|"
  "friedman|Stanton friedman.jpg|CC BY-SA 3.0|Wikimedia Commons|"
  "freixedo|SavadorFreixedo1.JPG|CC BY-SA 3.0|Vetranio / Wikimedia Commons|"
  "delonge|Tom DeLonge in 2011.jpg|CC BY-SA 2.5|Wikimedia Commons|"
  "grusch|David Grusch giving testimony on 26 July 2023 before the US House Subcommittee on National Security the Border and Foreign Affairs.png|Public domain|U.S. House of Representatives|testimonio del Congreso (PD)"
  "vallee|Jacques Vallée by Christopher Michel in 2024 03.jpg|CC BY 4.0|Christopher Michel / Wikimedia Commons|VERIFICAR licencia exacta"
  "hynek|Allen Hynek Jacques Vallee 1.jpg|Public domain|USAF / Wikimedia Commons|VERIFICAR — foto grupal con Vallée, requiere recorte"
  # ── Probables (confirmar licencia abriendo la página del archivo) ────
  "taylor-t|Travis S Taylor.png|VERIFICAR|Wikimedia Commons|VERIFICAR licencia"
  "coulthart|Ross Coulthart (cropped).jpg|VERIFICAR|Wikimedia Commons|VERIFICAR licencia"
  "bigelow|Robert Bigelow at BEAM press conference.jpg|VERIFICAR (prob. PD-NASA)|Bill Ingalls / NASA|VERIFICAR cuál archivo es la foto NASA"
  # knapp: Category:George Knapp (journalist) tiene ~20 archivos pero el
  # manifiesto no fijó uno; elige el retrato y añade la línea aquí.
)

ok=0; fail=0; snippet=""
for e in "${ENTRIES[@]}"; do
  IFS='|' read -r id file license credit note <<< "$e"
  enc=${file// /%20}
  url="https://commons.wikimedia.org/wiki/Special:FilePath/${enc}"
  dest="$OUT/${id}.jpg"
  printf '→ %-12s %s\n' "$id" "${note:-}"
  if curl -sS -L --max-time 30 -o "$dest" "$url" \
     && file "$dest" | grep -qiE 'image data'; then
    printf '   OK  %s  [%s]\n' "$(du -h "$dest" | cut -f1)" "$license"
    ok=$((ok+1))
    snippet+="  ${id}: photo=/researchers/${id}.jpg  credit=\"${credit}\"  license=\"${license}\"\n"
  else
    printf '   FALLÓ la descarga (¿red bloqueada / archivo movido?)\n'
    rm -f "$dest"; fail=$((fail+1))
  fi
done

echo
echo "Descargadas: $ok   Fallidas: $fail"
echo
echo "Campos para data/researchers.json (revisar VERIFICAR antes de commitear):"
printf '%b' "$snippet"
