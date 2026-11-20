# Lector ciego (prueba del lector de `/auditar-prosa` §2 y `/nuevo-caso` 5d)

Corre el lector con `claude -p` desde un directorio temporal **fuera del repo**, para que no reciba `CLAUDE.md`. Fuera de `web/`: no se despliega.

```bash
node tools/lector-ciego/lector.mjs --lang es agoncillo-1978            # hasta 5 fichas distintas
node tools/lector-ciego/lector.mjs --lang en belo-horizonte-1985 --out /ruta/lector-en.md
node tools/lector-ciego/lector.mjs --control                           # ¿el lector ve reglas?
```

- **Por qué existe**: el subagente `ficha-lector` recibía `CLAUDE.md` entero; preguntado sin abrir archivos, citó la regla E56 de muletillas (20 nov 2026). Un lector que conoce la guía no mide lo que entiende un lector cualquiera.
- **Qué lo hace ciego**: `CLAUDE.md` se busca subiendo desde el directorio de trabajo, y el temporal no está bajo el repo. `--setting-sources local` deja fuera también `~/.claude/CLAUDE.md`: con `user`, un marcador puesto ahí se coló; con `local`, no. `--system-prompt` sustituye el prompt de Claude Code y `--tools Read` deja solo la lectura.
- **Texto**: título, lugar, resumen, «Qué pasó» y «Por qué importa» en un idioma, con cada `[[slug]]` cambiado por «↗», como lo muestra el sitio. El brief se lee de `.claude/commands/auditar-prosa.md` (su único hogar); si cambia su primera frase, el script avisa.
- **Costo** (medido el 20 nov 2026, Opus): 0,11 USD por una ficha en español y 0,12 por una en inglés; el control, 0,02. Necesita credencial de modelo: es **on-demand, no un gate del build ni de CI**.
- Corre `--control` tras actualizar Claude Code: la respuesta debe ser «No». En la nube aparece la línea de atribución de commits que inyecta el entorno; no es una regla de redacción.
