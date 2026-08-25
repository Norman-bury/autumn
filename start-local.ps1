param(
    [int]$BackendPort = 5577,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$DataDir = Join-Path $ProjectRoot "data"
$UploadsDir = Join-Path $ProjectRoot "uploads"
$EnvFile = Join-Path $BackendDir ".env"

New-Item -ItemType Directory -Force -Path $DataDir, $UploadsDir | Out-Null

if (-not (Test-Path $EnvFile)) {
    $secretBytes = New-Object byte[] 32
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($secretBytes)
    $rng.Dispose()
    $secret = ([BitConverter]::ToString($secretBytes) -replace "-", "").ToLowerInvariant()
    @(
        "SECRET_KEY=$secret"
        "SQLITE_PATH=../data/autumn-recruitment.db"
        "UPLOAD_DIR=../uploads"
        "APP_URL=http://localhost:$FrontendPort"
        "CORS_ORIGINS=http://localhost:$FrontendPort"
        "SINGLE_USER_MODE=true"
    ) | Set-Content -Path $EnvFile -Encoding utf8
}

Push-Location $BackendDir
try {
    uv sync --all-groups
    uv run alembic upgrade head
} finally {
    Pop-Location
}

Push-Location $FrontendDir
try {
    corepack yarn install --immutable
} finally {
    Pop-Location
}

$backendCommand = "Set-Location '$BackendDir'; uv run uvicorn app.main:app --reload --port $BackendPort"
$frontendCommand = "Set-Location '$FrontendDir'; corepack yarn dev --host 127.0.0.1 --port $FrontendPort"

Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCommand

Write-Host "Autumn Recruitment Tracker is running:" -ForegroundColor Green
Write-Host "http://localhost:$FrontendPort"
