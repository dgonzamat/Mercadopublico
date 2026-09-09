# Limpiador · app Android de archivos basura

App Android (Kotlin, sin dependencias exóticas) que escanea la galería del teléfono y propone eliminar:

| Categoría | Criterio | ¿Preseleccionada? |
|---|---|---|
| Capturas de pantalla | carpeta `Screenshots`/`Capturas` o nombre `Screenshot_*` | sí |
| Fotos y videos duplicados | mismo tamaño **y** mismo SHA-256 (copias idénticas); se conserva la más antigua | sí |
| Imágenes minúsculas o vacías | < 20 KB, o lado mayor < 256 px, o 0 bytes (miniaturas, stickers, restos de caché) | sí |
| Videos grandes | ≥ 200 MB, solo para revisar | no |

**Nada se borra sin dos confirmaciones**: la de la app y la del diálogo del sistema (`MediaStore.createDeleteRequest`). En teléfonos con papelera de galería (Android 11+, según fabricante) los archivos van a la papelera 30 días.

## Instalar

1. Descarga `dist/limpiador-v1.0.apk` en el teléfono.
2. Ábrelo; Android pedirá permitir «instalar apps desconocidas» para el navegador o el gestor de archivos.
3. Al abrir la app, concede el permiso de fotos y videos y pulsa **Buscar archivos basura**.

Requiere **Android 11 o superior** (`minSdk 30`). El APK está firmado con la clave de desarrollo versionada en `keystore/debug.keystore` (no es un secreto): así el APK local y el de CI comparten firma y las actualizaciones se instalan encima sin desinstalar.

## Compilar

```bash
cd android-cleaner
./gradlew assembleRelease        # → app/build/outputs/apk/release/app-release.apk
```

Necesita JDK 17+ y el Android SDK (platform 35, build-tools 35.0.0); `local.properties` con `sdk.dir=…` o la variable `ANDROID_HOME`. El workflow `.github/workflows/android-apk.yml` compila el APK en GitHub Actions y lo publica como artifact en cada cambio de esta carpeta.

## Estructura

```
app/src/main/kotlin/com/dgonzamat/limpiador/
  Model.kt         # Category, MediaFile, JunkItem, formatSize
  JunkScanner.kt   # consulta MediaStore y clasifica (solo lectura)
  JunkAdapter.kt   # lista con cabeceras por categoría + miniaturas
  MainActivity.kt  # permisos, escaneo, selección y borrado por lotes
```

## Límites conocidos

- Solo toca la galería (imágenes y videos vía MediaStore). No limpia caché de otras apps: Android no lo permite desde una app de terceros sin acceso total al almacenamiento.
- «Duplicado» significa copia byte a byte. Dos fotos casi iguales (ráfaga, recomprimida por WhatsApp) no se detectan.
- En Android 14+ con acceso parcial («seleccionar fotos») solo se analizan las fotos elegidas.
