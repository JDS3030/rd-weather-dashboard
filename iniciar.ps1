$BASE = Split-Path -Parent $MyInvocation.MyCommand.Path
$Host.UI.RawUI.WindowTitle = "MeteoRD Dashboard"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "     MeteoRD Dashboard - Iniciador"         -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ── Función: recargar PATH desde el registro ─────────────────────────────────
function Reload-Path {
    $machine = [System.Environment]::GetEnvironmentVariable("PATH", "Machine")
    $user    = [System.Environment]::GetEnvironmentVariable("PATH", "User")
    $env:PATH = "$machine;$user"
}

# ── Función: buscar node.exe en rutas comunes ─────────────────────────────────
function Find-NodeExe {
    $candidates = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe",
        "$env:APPDATA\nvm\current\node.exe"
    )
    foreach ($p in $candidates) {
        if (Test-Path $p) { return $p }
    }
    # También buscar en PATH actual
    $found = Get-Command node -ErrorAction SilentlyContinue
    if ($found) { return $found.Source }
    return $null
}

# ── Verificar Node.js ─────────────────────────────────────────────────────────
Reload-Path
$nodeExe = Find-NodeExe

if (-not $nodeExe) {
    Write-Host "[!] Node.js no encontrado. Instalando via winget..." -ForegroundColor Yellow

    # Intentar con winget primero (Windows 11 lo incluye)
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Host "    Usando winget (puede tardar 1-2 minutos)..."
        winget install OpenJS.NodeJS.LTS --silent --accept-source-agreements --accept-package-agreements
        Reload-Path
        $nodeExe = Find-NodeExe
    }

    # Si winget falla o no está, bajar el MSI
    if (-not $nodeExe) {
        Write-Host "    Descargando instalador MSI de nodejs.org..."
        try {
            $index   = Invoke-RestMethod "https://nodejs.org/dist/index.json"
            $version = ($index | Where-Object { $_.lts } | Select-Object -First 1).version
            $msiUrl  = "https://nodejs.org/dist/$version/node-$version-x64.msi"
            $msiPath = "$env:TEMP\nodejs_lts.msi"

            Write-Host "    Descargando Node.js $version ..."
            Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath -UseBasicParsing

            Write-Host "    Instalando (requiere un momento)..."
            $proc = Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /quiet /norestart ADDLOCAL=ALL" -Wait -PassThru
            if ($proc.ExitCode -ne 0) { throw "msiexec exitCode $($proc.ExitCode)" }

            Reload-Path
            $nodeExe = Find-NodeExe
        }
        catch {
            Write-Host ""
            Write-Host "[ERROR] No se pudo instalar Node.js automaticamente: $_" -ForegroundColor Red
            Write-Host "        Instalalo manualmente desde: https://nodejs.org" -ForegroundColor Yellow
            Read-Host "Presiona Enter para cerrar"
            exit 1
        }
    }

    if (-not $nodeExe) {
        Write-Host ""
        Write-Host "[OK] Node.js se instalo pero requiere reiniciar la terminal." -ForegroundColor Yellow
        Write-Host "     Cierra esta ventana y vuelve a ejecutar iniciar.bat"     -ForegroundColor Yellow
        Read-Host "Presiona Enter para cerrar"
        exit 0
    }
}

# Asegurar que el directorio de node este en PATH de esta sesion
$nodeDir = Split-Path $nodeExe
if ($env:PATH -notlike "*$nodeDir*") {
    $env:PATH = "$nodeDir;$env:PATH"
}

$npmCmd  = Join-Path $nodeDir "npm.cmd"
$nodeVer = & $nodeExe --version
Write-Host "[OK] Node.js $nodeVer detectado en: $nodeExe" -ForegroundColor Green

# ── Crear .env si no existe ──────────────────────────────────────────────────
$envFile    = Join-Path $BASE "backend\.env"
$envExample = Join-Path $BASE "backend\.env.example"

if (-not (Test-Path $envFile)) {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host ""
        Write-Host "[!] Se creo backend\.env desde el ejemplo." -ForegroundColor Yellow
        Write-Host "    Edita ese archivo y pon tu clave de WeatherAPI (gratis en weatherapi.com)." -ForegroundColor Yellow
        Write-Host ""
        Read-Host "Presiona Enter para continuar"
    }
}

# ── Instalar dependencias del backend ───────────────────────────────────────
$backendModules = Join-Path $BASE "backend\node_modules"
if (-not (Test-Path $backendModules)) {
    Write-Host "[1/2] Instalando dependencias del backend..."
    Push-Location (Join-Path $BASE "backend")
    & $npmCmd install
    $exitCode = $LASTEXITCODE
    Pop-Location
    if ($exitCode -ne 0) {
        Write-Host "[ERROR] Fallo npm install en el backend (codigo $exitCode)." -ForegroundColor Red
        Read-Host "Presiona Enter para cerrar"
        exit 1
    }
    Write-Host "      Listo." -ForegroundColor Green
    Write-Host ""
}

# ── Instalar dependencias del frontend ──────────────────────────────────────
$frontendModules = Join-Path $BASE "frontend\node_modules"
if (-not (Test-Path $frontendModules)) {
    Write-Host "[2/2] Instalando dependencias del frontend..."
    Push-Location (Join-Path $BASE "frontend")
    & $npmCmd install
    $exitCode = $LASTEXITCODE
    Pop-Location
    if ($exitCode -ne 0) {
        Write-Host "[ERROR] Fallo npm install en el frontend (codigo $exitCode)." -ForegroundColor Red
        Read-Host "Presiona Enter para cerrar"
        exit 1
    }
    Write-Host "      Listo." -ForegroundColor Green
    Write-Host ""
}

# ── Iniciar servidores ───────────────────────────────────────────────────────
Write-Host "Iniciando backend  (puerto 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoProfile -NoExit -Command `"& '$nodeExe' '$BASE\backend\server.js'`""

Write-Host "Esperando al backend..."
Start-Sleep -Seconds 3

Write-Host "Iniciando frontend (puerto 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoProfile -NoExit -Command `"Set-Location '$BASE\frontend'; & '$npmCmd' run dev`""

Write-Host "Esperando al frontend..."
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host " Abriendo: http://localhost:5173"            -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Todo en marcha. Puedes cerrar esta ventana." -ForegroundColor Green
Write-Host "Para detener la app cierra las ventanas de Backend y Frontend."
Start-Sleep -Seconds 3
