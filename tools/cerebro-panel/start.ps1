# Lanza el panel DESACOPLADO de quien ejecuta este script.
#
# Por qué existe: `node tools\cerebro-panel\server.mjs` a secas deja el panel
# colgando del proceso que lo lanzó — la terminal, o la sesión de un agente. Si
# esa sesión se cierra o el harness limpia su árbol de procesos, el panel muere
# con ella. Y muere DURO (TerminateProcess): sin señal, sin excepción, sin línea
# en `panel.log`. Desde fuera parece que "se cae solo".
#
# El truco es Win32_Process.Create vía WMI: el proceso nuevo cuelga del servicio
# WMI, no de esta shell, así que sobrevive a que quien lo lanzó desaparezca.
#
#   powershell -ExecutionPolicy Bypass -File tools\cerebro-panel\start.ps1
#   ... -Puerto 4181     otro puerto
#   ... -Detener         solo apagar el que haya

param(
  [int]$Puerto = 4180,
  [switch]$Detener
)

$ErrorActionPreference = "Stop"
$raiz = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

# Apagar cualquier instancia previa. Stop-Process es un TerminateProcess, así que
# no deja línea de cierre: la escribimos nosotros para que la bitácora no mienta.
$previos = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like "*cerebro-panel*server.mjs*" }
foreach ($p in $previos) {
  Add-Content -Path (Join-Path $PSScriptRoot "panel.log") -Encoding utf8 `
    -Value "[$((Get-Date).ToUniversalTime().ToString('o'))] apagado por start.ps1 | pid $($p.ProcessId)"
  Stop-Process -Id $p.ProcessId -Force
  Write-Host "apagado el panel previo (pid $($p.ProcessId))"
}
if ($Detener) { return }

$cmd = "node `"$raiz\tools\cerebro-panel\server.mjs`" --port $Puerto --no-open"
$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create `
       -Arguments @{ CommandLine = $cmd; CurrentDirectory = $raiz }
if ($r.ReturnValue -ne 0) { throw "Win32_Process.Create falló (código $($r.ReturnValue))" }

# No damos por vivo lo que no respondió: esperamos a que el puerto conteste.
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Milliseconds 400
  try {
    $e = (Invoke-WebRequest "http://127.0.0.1:$Puerto/api/state" -TimeoutSec 3 -UseBasicParsing).Content | ConvertFrom-Json
    Write-Host "panel vivo · pid $($r.ProcessId) · http://127.0.0.1:$Puerto · permisos $($e.permisos)"
    return
  } catch { }
}
throw "el panel no respondió en 12 s — revisa tools\cerebro-panel\panel.log"
