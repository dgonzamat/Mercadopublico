#!/usr/bin/env bash
# PostToolUse hook — valida la INTEGRIDAD ESTRUCTURAL del corpus en cuanto se
# edita un archivo de datos (data/cases/*.json o data/researchers.json), en vez
# de esperar al prebuild. Es la aplicación del patrón "PostToolUse hooks" del
# self-learning de Boris Cherny: mover el chequeo al momento del edit acorta el
# loop — un posterior MECE que no suma 1, un id duplicado o un JSON roto se ve
# al instante, no cuando corre `npm run build` mucho después.
#
# Corre exactamente `scripts/validate-schema.mjs` (el mismo que el prebuild/CI).
# Exit 2 => stderr se devuelve a Claude como feedback bloqueante.
set -uo pipefail

# El payload del hook llega por stdin como JSON; extraer tool_input.file_path.
file_path=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).tool_input?.file_path||"")}catch{console.log("")}})')

# Solo actuar sobre las fuentes de verdad del corpus.
case "$file_path" in
  *data/cases/*.json|*data/researchers.json) ;;
  *) exit 0 ;;
esac

repo_root=$(cd "$(dirname "$0")/../.." && pwd)
cd "$repo_root/web" || exit 0

if ! out=$(node scripts/validate-schema.mjs 2>&1); then
  {
    echo "$out"
    echo ""
    echo "⛔ Schema inválido tras editar ${file_path}. Corrige los errores de arriba antes de seguir (es el mismo gate que rompe el build en CI)."
  } >&2
  exit 2
fi
exit 0
