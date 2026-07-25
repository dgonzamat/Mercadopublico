# Cómo disparar el cerebro

El cerebro **no se autoconvoca**: arranca cuando alguien lo invoca con un modo.
Hay cuatro superficies para hacerlo, y no son intercambiables — cada una existe
porque las otras no llegaban a ese sitio.

| Superficie | Dispara | Muestra el flujo | Dónde corre |
|---|---|---|---|
| CLI (`/cerebro <modo>`) | sí | no | tu terminal |
| [Panel](../tools/cerebro-panel/) (`127.0.0.1:4180`) | sí | **en vivo** | tu máquina |
| Formulario de Actions | sí, 3 toques | no | runner de GitHub |
| Atajo del teléfono | **sí, 1 toque** | no | runner de GitHub |

Los cuatro lanzan el mismo `claude -p "/cerebro <modo>"`, así que el cerebro no
sabe —ni le importa— por dónde entró.

---

## Desde el teléfono, con un toque

Es la vía para cuando no estás delante del computador. El atajo llama a la API
de GitHub, que dispara el workflow `cerebro.yml`; la corrida ocurre en el runner
y deja un PR en borrador.

### La llamada

```http
POST https://api.github.com/repos/dgonzamat/Mercadopublico/actions/workflows/cerebro.yml/dispatches

Authorization: Bearer <TOKEN>
Accept: application/vnd.github+json
Content-Type: application/json

{
  "ref": "main",
  "inputs": { "modo": "mejoras-ux", "senal": "…" }
}
```

**Usa el nombre del archivo (`cerebro.yml`), no el id numérico.** La API acepta
los dos, pero el id (`320393029` hoy) cambia si el workflow se borra y se vuelve
a crear, y entonces el atajo falla con un 404 que parece un problema de permisos.
El nombre del archivo no driftea.

`ref` debe ser **`main`**: es la rama desde la que se ejecuta el workflow, y
además `workflow_dispatch` solo está disponible una vez que el archivo vive en la
rama por defecto.

Los valores válidos de `modo` son los del desplegable del workflow, que a su vez
son los que declara `cerebro.md`. No se listan aquí a propósito: una cuarta copia
driftaría, y la paridad workflow↔skill ya la vigila `audit-skills.mjs` (regla
**X10**). Si necesitas verlos, mira el desplegable o la tabla de modos del skill.

### El token

Un **fine-grained PAT**, no uno clásico:

- *Repository access* → **Only select repositories** → `dgonzamat/Mercadopublico`
- *Permissions* → *Repository permissions* → **Actions: Read and write**
- nada más — ni contents, ni PRs, ni workspace-wide

Ese es todo el poder que el atajo necesita: disparar un workflow. El PR lo abre
el propio workflow con el `GITHUB_TOKEN` del runner, no con tu PAT.

El token vive en el atajo, en tu teléfono. Revocable desde GitHub en cualquier
momento. **El repo es público** — no lo pegues en un issue, un PR ni el código.

### iOS · Atajos

1. **Atajos** → `+` → *Añadir acción* → busca **«Obtener contenido de URL»**.
2. URL: la de arriba.
3. Despliega *Mostrar más*:
   - **Método**: `POST`
   - **Encabezados**: `Authorization` → `Bearer <TOKEN>` · `Accept` → `application/vnd.github+json`
   - **Cuerpo de la solicitud**: `JSON`
   - Campos: `ref` (Texto) = `main` · `inputs` (Diccionario) con `modo` (Texto) y
     `senal` (Texto).
4. En `senal`, toca el campo y elige **«Preguntar cada vez»** — así el atajo te
   pide la señal al lanzarlo. La regla de oro del cerebro es que cada disparo
   cite la suya.
5. Renómbralo («Cerebro · mejoras-ux») y **Añadir a pantalla de inicio**.

Un atajo por modo, o uno solo que empiece con *Elegir de un menú* y pase la
opción a `modo`.

### Android · HTTP Shortcuts

Misma llamada. En la app: nuevo shortcut → método `POST` → pestaña *Request Body*
en `application/json` con el cuerpo de arriba → pestaña *Headers* con los dos
encabezados. Para pedir la señal al lanzar, usa una variable de tipo *Text input*
e insértala en el cuerpo.

### Qué respuesta esperar

| Código | Significa |
|---|---|
| **204** | Disparado. No devuelve cuerpo — es lo normal, no un error. |
| 401 | Token inválido o mal formado (¿falta `Bearer `?). |
| 403 | El token no tiene *Actions: Read and write* sobre este repo. |
| 404 | El workflow no existe en `main`, o el token no ve el repo. |
| 422 | `ref` inexistente, o un `modo` que no está en el desplegable. |

El 204 no dice si la corrida terminó bien: solo que se encoló. El resultado está
en la pestaña *Actions* y en el PR que abre al final.

---

## Registro (NO re-buscar) · por qué el botón no puede vivir en un artifact (jul 2026)

Se intentó y **no es posible**, por dos muros independientes:

1. **No existe conector de GitHub en el directorio de claude.ai.** Búsquedas en
   el registro con `github`, `actions`, `workflow dispatch`, `git`,
   `pull request`, `source control`, `CI` — cero resultados de GitHub. Hay
   Linear, Datadog, Railway, incident.io, pero no GitHub. Los servidores MCP de
   una sesión de Claude Code (que sí incluyen GitHub) **no cuentan**: la
   capability `mcp` de los artifacts solo alcanza conectores de claude.ai.
2. **La CSP de los artifacts bloquea toda llamada a hosts externos** — `fetch`,
   XHR, WebSockets. Un artifact no puede llamar a `api.github.com` aunque tenga
   el token. Lo único invocable es `window.claude.mcp`.

O sea: aunque mañana apareciera el conector, el camino seguiría siendo ese único.
Y sin él, **ningún artifact podrá disparar el workflow**. El artifact sirve para
*preparar* el disparo (elegir modo, componer la señal, copiarla) y para leer el
rastro; el disparo lo hace el atajo, el formulario, el panel o el CLI.
