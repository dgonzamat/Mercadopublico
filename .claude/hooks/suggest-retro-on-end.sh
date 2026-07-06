#!/usr/bin/env bash
# SessionEnd hook — al cerrar la sesión, si hubo trabajo cosechable, sugiere
# correr /retro para no perder las lecciones que no se capturaron en caliente.
# Es el disparador del "cosechador de cierre" del loop de self-learning: /retro
# mina la sesión, pero alguien tiene que acordarse de correrlo — esto lo recuerda.
#
# Diseño:
#  - Solo habla si la sesión tocó fuente de verdad (working tree sucio o commits
#    sin pushear). En sesiones triviales calla, para no volverse ruido ignorable.
#  - No puede bloquear ni inyectar contexto (la sesión ya termina); su salida es
#    un recordatorio. La acción real (`/retro`) se corre antes de cerrar o al
#    abrir la próxima sesión.
set -uo pipefail

# Payload del hook por stdin: extraer el motivo de cierre (clear|logout|other…).
reason=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).reason||"")}catch{console.log("")}})' 2>/dev/null)

repo_root=$(cd "$(dirname "$0")/../.." && pwd)
cd "$repo_root" || exit 0

# ¿Hizo trabajo esta sesión? Sucio en el working tree, o commits por delante del
# upstream de la rama. Si no, salir en silencio.
dirty=$(git status --porcelain 2>/dev/null | grep -v '^?? ' | head -1)
ahead=$(git rev-list --count '@{upstream}..HEAD' 2>/dev/null || echo 0)

if [ -z "$dirty" ] && [ "${ahead:-0}" = "0" ]; then
  exit 0
fi

{
  echo "──────────────────────────────────────────────"
  echo "🧠 Sesión con cambios sin cosechar${reason:+ (cierre: $reason)}."
  echo "   Antes de cerrar —o al abrir la próxima sesión— considera:"
  echo "     /retro           # propone las lecciones de esta sesión"
  echo "     /retro --apply    # y las persiste en CLAUDE.md"
  echo "   Así el loop de self-learning no pierde lo que costó descubrir."
  echo "──────────────────────────────────────────────"
} >&2

exit 0
