---
description: Destila una corrección o gotcha de la conversación en una lección y la escribe en CLAUDE.md (self-learning loop de Boris Cherny)
argument-hint: "[lección opcional en texto libre; si se omite, se infiere de la conversación reciente]"
---

Estás ejecutando el **loop de self-learning** del repo. Objetivo: convertir un error, corrección o gotcha recién descubierto en una regla persistente dentro de `CLAUDE.md`, para que ninguna sesión futura lo repita. Sigue el `## Protocolo de aprendizaje` de `CLAUDE.md`.

## Entrada

`$ARGUMENTS` puede traer la lección ya redactada por el usuario. Si viene vacío, **infiere la lección** de la conversación reciente: busca la última corrección del usuario, un fallo de build/audit, o una convención que costó descubrir.

## Pasos

1. **Identifica la lección.** En una frase: ¿qué salió mal o qué convención frágil apareció, y — más importante — **por qué** (la causa raíz)? Sin el porqué la regla no sirve.

2. **Clasifica dónde va** (no crees secciones nuevas si encaja en una existente):
   - Gotcha técnico reproducible (webpack, Tailwind JIT, imports de Next, invariante de audit) → sección **`## Anti-patterns conocidos`**, línea `**No** … (porque …)`.
   - Regla de dominio (schema `UAPCase`, modelo MECE, línea editorial de longitud) → la sección temática correspondiente.
   - Resultado de investigación cara que no debe re-hacerse → un bloque tipo *Registro (NO re-buscar)* con fecha `(mmm aaaa)`.

3. **Chequea duplicados.** Lee la sección destino. Si ya existe una regla equivalente, **consolídala/afínala** en vez de agregar una redundante. Menos reglas y más nítidas > muchas difusas.

4. **Redacta la lección** en el formato de la casa: una línea, imperativa, con el porqué entre paréntesis. Español. Fecha los registros de investigación.

5. **Aplica el edit** a `CLAUDE.md` con la herramienta Edit (inserción quirúrgica, sin reordenar el resto del archivo).

6. **Confirma** al usuario: muestra la línea agregada/modificada y en qué sección quedó. Si la lección era ambigua o podía ir en dos secciones, dilo y pide validación antes de commitear.

No commitees ni pushees salvo que el usuario lo pida — este comando solo actualiza la memoria.
