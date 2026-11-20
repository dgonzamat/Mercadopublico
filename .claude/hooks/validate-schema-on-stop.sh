#!/usr/bin/env bash
# Stop hook — cierra el hueco del hook PostToolUse: ese solo ve Edit/Write, así
# que una ficha escrita desde Bash o node (las seis de abducción y contacto de
# nov 2026) se saltaba la validación hasta el prebuild. Al terminar el turno,
# si el árbol tiene cambios en las fuentes de verdad del corpus, corre el mismo
# validate-schema.mjs; si falla, exit 2 devuelve el error a Claude y el turno
# sigue en vez de cerrarse con el schema roto.
set -uo pipefail

# Evitar el bucle: si Claude ya está continuando por este hook, no volver a frenar.
active=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).stop_hook_active?"1":"")}catch{console.log("")}})')
[ -n "$active" ] && exit 0

repo_root=$(cd "$(dirname "$0")/../.." && pwd)
cd "$repo_root" || exit 0

# Solo actuar si hay cambios (staged, unstaged o nuevos) en los datos validados.
changed=$(git status --porcelain -- web/data/cases web/data/researchers.json 2>/dev/null)
[ -z "$changed" ] && exit 0

cd web || exit 0
if ! out=$(node scripts/validate-schema.mjs 2>&1); then
  {
    echo "$out"
    echo ""
    echo "⛔ Schema inválido en los datos modificados en esta sesión (posiblemente escritos desde Bash o node, que el hook de edición no ve):"
    echo "$changed"
    echo "Corrige los errores antes de terminar (es el mismo gate que rompe el build en CI)."
  } >&2
  exit 2
fi

# Con el schema sano, la auditoría (~2 s): prosa (E7, E52, E56, E59…) y proceso
# (E45, E63), que hasta ahora solo saltaban si alguien la corría o en el CI.
# Solo se devuelven los ERROR; los WARN agregados no frenan el turno.
if ! out=$(node scripts/audit-consistency.mjs 2>&1); then
  {
    echo "$out" | awk '/ERROR/{p=1} /WARN/{p=0} p' | head -60
    echo ""
    echo "⛔ audit-consistency da ERROR con datos modificados en esta sesión:"
    echo "$changed"
    echo "Corrige lo que sea de esta sesión. Si un ERROR no lo causó ella (p. ej. E45 por el num de otra rama), dilo al usuario en vez de tocarlo."
  } >&2
  exit 2
fi
exit 0
