#!/usr/bin/env bash
# PreToolUse hook (Bash) — prohíbe lo que no se puede deshacer: push forzado
# sin lease (reescribe historia ajena) y cualquier push directo a main (el
# protocolo exige PR). --force-with-lease se permite: CLAUDE.md lo admite al
# reiniciar una rama cuyo PR ya se fusionó. Se hace con hook y no con
# permissions.deny porque las reglas de prefijo no distinguen --force de
# --force-with-lease ni ven el destino al final del comando.
set -uo pipefail

cmd=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).tool_input?.command||"")}catch{console.log("")}})')

# Solo comandos que contienen un git push.
printf '%s' "$cmd" | grep -Eq '(^|[;&|[:space:]])git([[:space:]]+(-C[[:space:]]+[^[:space:]]+|-[^[:space:]]+))*[[:space:]]+push([[:space:]]|$)' || exit 0

# Partir en segmentos por ; && || | para revisar cada push por separado.
while IFS= read -r seg; do
  printf '%s' "$seg" | grep -Eq 'git([[:space:]]+(-C[[:space:]]+[^[:space:]]+|-[^[:space:]]+))*[[:space:]]+push([[:space:]]|$)' || continue
  if printf '%s' "$seg" | grep -Eq '(^|[[:space:]])(--force|-f|--force-if-includes)([[:space:]]|$)|[[:space:]]\+[^[:space:]]+'; then
    echo "⛔ Push forzado bloqueado: «$seg». Si el PR de la rama ya se fusionó, usa --force-with-lease; si no, haz fetch + merge (ver Git Operations)." >&2
    exit 2
  fi
  if printf '%s' "$seg" | grep -Eq '[[:space:]](origin[[:space:]]+)?([^[:space:]]*:)?(refs/heads/)?main([[:space:]]|$)'; then
    echo "⛔ Push directo a main bloqueado: «$seg». Empuja a tu rama y abre un PR (ver Branch protocol)." >&2
    exit 2
  fi
done < <(printf '%s\n' "$cmd" | sed -E 's/(&&|\|\||;|\|)/\n/g')
exit 0
