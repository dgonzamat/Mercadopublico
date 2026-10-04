# Limpiador · liberador de espacio para Android

App Android (Kotlin, Material 3 con colores dinámicos de Material You) que analiza el teléfono completo y revisa la seguridad de las apps y propone liberar espacio en doce grupos:

| Grupo | Criterio | ¿Preseleccionado? | Requiere |
|---|---|---|---|
| Apps sospechosas (antivirus) | **1. Malware conocido** (opcional, con tu clave gratuita de VirusTotal): la huella SHA-256 de cada app instalada fuera de una tienda, de las de tienda que ya salieron sospechosas y de cada instalador APK se compara con más de 70 antivirus; solo sale la huella, nunca el archivo. **2. Señales de riesgo** (sin conexión): sin ícono pero apareció en pantalla en las últimas 24 h (+4, adware de anuncios a pantalla completa), fuera de una tienda (+2), accesibilidad activa (+3), administradora del dispositivo (+3), lee SMS (+2), ≥3 permisos de espionaje (+2), es una de 4 o más utilidades cebo instaladas a la vez (+2, adware que se instala en cadena), se presenta como limpiador, acelerador, recuperador de fotos, galería o lector de PDF, lee notificaciones, sin ícono, instala apps, dibuja encima, puede abrir avisos a pantalla completa o trabajó en segundo plano con aviso fijo en las últimas 24 h (+1 c/u). Ver `RiskRules` para cuándo se lista | no | nada extra (VirusTotal: clave; conteo de pantallas: datos de uso) |
| Capturas de pantalla | carpeta `Screenshots`/`Capturas` o nombre `Screenshot_*`, **de hace más de 14 días** (las recientes no se listan) | sí | fotos |
| Fotos y videos repetidos | en la galería: mismo tamaño → mismos primeros 64 KB → mismo SHA-256 → **doble verificación byte a byte contra el original** (se repite justo antes de borrar); se conserva el más antiguo | sí | fotos |
| Fotos parecidas | huella perceptual dHash de cada foto comparada con todas: ≤4 bits entre fotos cualesquiera (reenvíos, otra carpeta u otra compresión) o ≤10 bits dentro de una ráfaga (misma carpeta, ≤10 s); se conserva la más grande | no | fotos |
| Archivos repetidos | fuera de la galería (documentos, audios, descargas ≥16 KB, no ocultos): mismo tamaño → mismos 64 KB → mismo SHA-256 → doble verificación byte a byte (también antes de borrar); se conserva el más antiguo | sí | todos los archivos |
| Imágenes inservibles | < 20 KB, lado mayor < 256 px o 0 bytes | sí | fotos |
| Temporales y caché | `*.tmp/.log/.bak/.part/.crdownload…`, carpetas `.thumbnails`, `.Statuses`, `cache`…, archivos vacíos, carpetas vacías | sí | todos los archivos |
| Instaladores APK | `*.apk/.apks/.xapk` | sí | todos los archivos |
| Videos pesados | ≥ 200 MB | no | fotos |
| Archivos grandes | ≥ 100 MB que no son fotos ni videos | no | todos los archivos |
| Descargas antiguas | en `Download/` desde hace más de 30 días | no | todos los archivos |
| Apps que no usas | sin abrir en 60 días, con tamaño app+datos+caché | no | datos de uso |

Más una sección **Más espacio** con el vaciado de **caché de todas las apps** (diálogo del sistema `ACTION_CLEAR_APP_CACHE`), la herramienta **«¿Qué app muestra los anuncios?»** (tras un anuncio que bloquea la pantalla o un aviso que salta, lista las últimas apps que ocuparon la pantalla o arrancaron un servicio con aviso fijo, y muestra cómo quitarlas), la configuración del **antivirus en la nube** (clave de VirusTotal), un acceso a **Google Play Protect** y accesos directos para conceder los dos permisos opcionales.

**Cómo se elimina cada cosa**: fotos y videos pasan por `MediaStore.createDeleteRequest` (confirmación de Android y papelera de 30 días donde exista); los archivos y carpetas se borran de inmediato tras la confirmación de la app; las apps se desinstalan una por una con el diálogo del sistema.

**Si una app no se deja desinstalar** (`RemovalHelp`): al terminar, la app lista las que siguen instaladas y, para cada una, los pasos en orden: quitarle el permiso de administrador, apagar su accesibilidad (con ella puede cerrar la pantalla de desinstalar), silenciar sus avisos, abrir su ficha (Forzar detención → Desinstalar), reintentar y, si nada funciona, modo seguro. También genera **comandos para el computador** (`adb shell pm uninstall …` y, si falla, `adb shell pm disable-user --user 0 …`) que se pueden copiar o enviar por correo o WhatsApp. Los mismos pasos se abren manteniendo presionada una app sospechosa en la revisión, o tocándola en «¿Qué app muestra los anuncios?». `Android/data` y `Android/obb` no se tocan: Android 11+ no los expone a apps de terceros, así que la caché interna de otras apps solo se vacía con la herramienta del sistema.

**Permisos**: la app funciona solo con el permiso de fotos (modo galería). «Acceso a todos los archivos» (`MANAGE_EXTERNAL_STORAGE`) y «Acceso a datos de uso» (`PACKAGE_USAGE_STATS`) se conceden en Ajustes y amplían el análisis; la app los explica y ofrece saltarlos.

## Cómo se usa

1. **Inicio**: anillo con el espacio usado/libre, la lista de los doce grupos con una casilla cada uno (se recuerdan) y el botón «Analizar mi teléfono».
2. **Análisis**: indicador animado con progreso en vivo («Comparando repetidos 40 de 120», «12.340 archivos del teléfono revisados…») y botón «Cancelar análisis».
3. **Resultados**: titular «Puedes liberar X» y una tarjeta por grupo con ícono, cantidad, tamaño y un interruptor para incluirlo o no. Tocar la tarjeta abre la **revisión en cuadrícula**: miniaturas (foto, ícono del APK o de la app), toque para marcar/desmarcar, mantener presionado para ver la foto, la ruta y fecha del archivo o la información de la app; botón Todos/Ninguno. Debajo, la sección **Más espacio**.
4. **Limpiar**: botón fijo abajo con el tamaño a liberar → confirmación de la app → confirmación de Android → pantalla «¡Listo! Liberaste X».

Si el análisis corrió sin «Acceso a todos los archivos», los resultados lo dicen arriba con un aviso y un botón para activarlo; el subtítulo indica siempre el alcance («Revisamos la galería y N archivos del teléfono»).

## Instalar

1. Descarga `dist/limpiador-v2.13.apk` en el teléfono.
2. Ábrelo; Android pedirá permitir «instalar apps desconocidas» para el navegador o el gestor de archivos.
3. Al abrir la app, concede el permiso de fotos y videos y pulsa **Buscar archivos basura**.

Requiere **Android 11 o superior** (`minSdk 30`). El APK está firmado con la clave de desarrollo versionada en `keystore/debug.keystore` (no es un secreto): así el APK local y el de CI comparten firma y las actualizaciones se instalan encima sin desinstalar.

## Capturas (renderizadas por las pruebas)

| Inicio | Análisis | Resultados | Seguridad | Cómo quitarla | Repetidos (doble check) | Archivos | Listo | Sin permiso |
|---|---|---|---|---|---|---|---|---|
| ![](docs/screenshots/01-inicio.png) | ![](docs/screenshots/02-analizando.png) | ![](docs/screenshots/03-resultados.png) | ![](docs/screenshots/13-revision-seguridad.png) | ![](docs/screenshots/17-como-quitarla.png) | ![](docs/screenshots/05c-revision-repetidos.png) | ![](docs/screenshots/05b-revision-residuos.png) | ![](docs/screenshots/06-listo.png) | ![](docs/screenshots/07-sin-permiso.png) |

## Pruebas

```bash
./gradlew testReleaseUnitTest   # Robolectric: Activities y layouts reales en la JVM
```

- `FileScannerTest`: almacenamiento falso en un directorio temporal (descargas viejas, APK, `.thumbnails`, `.Statuses` de WhatsApp, `.log`, archivo vacío, carpeta vacía, ZIP de 100 MB sparse, `Android/data` que debe saltarse). Verifica la clasificación y la preselección.
- `JunkScannerTest`: galería falsa (proveedor `media` simulado) con fotos normales, capturas, un duplicado byte a byte, un falso duplicado del mismo tamaño, miniaturas, un archivo vacío y un video pesado. Verifica la clasificación, la preselección y el progreso.
- `MainFlowTest`: flujo completo inicio → análisis → resultados (8 tarjetas + herramientas) → cuadrícula de fotos y lista de archivos (marcar, Todos/Ninguno, pulsación larga) → diálogo → borrado real de los archivos en disco → petición de borrado de la galería al sistema → pantalla Listo; y el caso «Solo la galería» + permiso denegado. Renderiza cada pantalla a PNG en `app/build/screenshots/` (modo gráfico nativo de Robolectric).

No sustituye una prueba en teléfono real: el diálogo de borrado de Android y las miniaturas reales solo se ven en un dispositivo.

## Compilar

```bash
cd android-cleaner
./gradlew assembleRelease        # → app/build/outputs/apk/release/app-release.apk
```

Necesita JDK 17+ y el Android SDK (platform 35, build-tools 35.0.0); `local.properties` con `sdk.dir=…` o la variable `ANDROID_HOME`. El workflow `.github/workflows/android-apk.yml` compila el APK en GitHub Actions y lo publica como artifact en cada cambio de esta carpeta.

## Estructura

```
app/src/main/kotlin/com/dgonzamat/limpiador/
  Model.kt             # Kind, Category, MediaFile, JunkItem, ScanProgress, ScanStore, formatSize
  ScanEngine.kt        # orquesta los tres escáneres; ganchos reemplazables en pruebas
  JunkScanner.kt       # galería (MediaStore): capturas, repetidos, minúsculas, videos pesados
  FileScanner.kt       # almacenamiento (File API): temporales, caché, vacíos, APK, descargas, grandes
  AppScanner.kt        # apps sin usar (UsageStatsManager + StorageStatsManager)
  SecurityScanner.kt   # apps sospechosas: señales de riesgo (RiskRules) + VirusTotal
  VirusTotal.kt        # consulta de huellas SHA-256 en VirusTotal
  ForegroundLog.kt     # registro de uso: pantallas abiertas y servicios en primer plano por app
  RemovalHelp.kt       # pasos y comandos ADB para apps que no se dejan desinstalar
  MainActivity.kt      # inicio → permisos → análisis → resultados (tarjetas + herramientas) → limpieza mixta → listo
  CategoryActivity.kt  # revisión de una categoría en cuadrícula
  GridAdapter.kt       # celdas de la cuadrícula (selección, miniatura, etiqueta)
  Thumbnails.kt        # miniaturas de MediaStore con caché LRU
  SquareCardView.kt    # MaterialCardView cuadrada para la cuadrícula
  LimpiadorApp.kt      # activa los colores dinámicos (Material You)
```

## Límites conocidos

- **Seguridad: límites del antivirus.** Una app sin root no puede leer el contenido de otras apps, ni ponerlas en cuarentena, ni detenerlas: detecta y lleva a desinstalar. La detección por firma depende de VirusTotal (clave del usuario, 4 consultas por minuto y 500 al día en la cuota gratuita según sus condiciones actuales; la app consulta hasta 20 huellas por análisis, una cada 15 s). Sin clave solo hay señales de riesgo, que pueden dar falsos positivos y no ven malware que no las muestre. Una app administradora del dispositivo no se desinstala hasta desactivarla en Ajustes › Seguridad; la app lo avisa.
- **Si el malware no deja usar el teléfono** (anuncios que tapan la pantalla o reaparecen): reiniciar en **modo seguro** (mantener apagar → mantener «Apagar» → «Modo seguro»; varía por fabricante). En modo seguro no corre ninguna app de terceros, tampoco esta, pero se puede desinstalar desde Ajustes › Apps la app que Limpiador señaló.
- «¿Qué app muestra los anuncios?» y la señal «apareció en pantalla sin ícono» usan el registro de uso de Android (`ACTIVITY_RESUMED`). Si el anuncio se dibuja como capa (permiso de dibujar sobre otras apps) en vez de como pantalla, no queda en ese registro: ahí ayuda la señal «puede dibujar sobre otras apps».
- La señal «trabajó en segundo plano» y la parte de avisos de «¿Qué app muestra los anuncios?» usan el evento `FOREGROUND_SERVICE_START` del registro de uso (Android 10+). Está probado con el registro simulado de las pruebas, no en un teléfono real; si un fabricante no lo registra, esas dos partes no ven nada.
- Las palabras de «utilidad cebo» (galería, lector de PDF, recuperar…) también describen apps legítimas. Por eso solo suman con otra señal o cuando hay 4 o más instaladas a la vez; aun así puede haber falsos positivos, y nada se marca solo.
- Los comandos ADB no los probé contra malware real: `pm uninstall` falla mientras la app siga siendo administradora (hay que quitarle ese permiso antes), y no sé si `pm disable-user` funciona sobre una administradora activa.
- El acceso a Play Protect abre un componente de Google Play Services que no es una API pública documentada; si no existe, abre Ajustes › Seguridad.

- La caché interna de otras apps (`Android/data`) no es accesible para apps de terceros en Android 11+; se vacía con la herramienta del sistema que la app enlaza.
- «Duplicado» significa copia byte a byte. Dos fotos casi iguales (ráfaga, recomprimida por WhatsApp) no se detectan.
- En Android 14+ con acceso parcial («seleccionar fotos») y sin «todos los archivos», solo se analizan las fotos elegidas.
- `ACTION_CLEAR_APP_CACHE` y el detalle de tamaño por app dependen del fabricante; si el teléfono no los ofrece, la app lo indica y enlaza a Ajustes › Almacenamiento.
