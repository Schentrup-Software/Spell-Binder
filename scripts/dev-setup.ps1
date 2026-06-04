# dev-setup.ps1 - Sets up the local development environment for Spell Binder on Windows

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
$pbVersion = "0.28.4"

Write-Host "=== Spell Binder Dev Setup ===" -ForegroundColor Cyan

# 1. Create .env if it doesn't exist
$envFile = Join-Path $projectRoot ".env"
$envExample = Join-Path $projectRoot ".env.example"
if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    $rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
    $bytes = New-Object byte[] 32
    $rng.GetBytes($bytes)
    $key = [Convert]::ToBase64String($bytes)
    (Get-Content $envFile) -replace 'your-secure-encryption-key-here-32-chars-minimum', $key | Set-Content $envFile
    Write-Host "[OK] Created .env with a generated encryption key" -ForegroundColor Green
} else {
    Write-Host "[SKIP] .env already exists" -ForegroundColor Yellow
}

# 2. Download PocketBase for Windows if not present
$pbDir = Join-Path $projectRoot "pocketbase"
$pbExe = Join-Path $pbDir "pocketbase.exe"
if (-not (Test-Path $pbExe)) {
    Write-Host "Downloading PocketBase v$pbVersion for Windows..." -ForegroundColor Cyan
    $pbUrl = "https://github.com/pocketbase/pocketbase/releases/download/v$pbVersion/pocketbase_${pbVersion}_windows_amd64.zip"
    $zipPath = Join-Path $pbDir "pocketbase.zip"
    Invoke-WebRequest -Uri $pbUrl -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath $pbDir -Force
    Remove-Item $zipPath
    Write-Host "[OK] PocketBase v$pbVersion downloaded" -ForegroundColor Green
} else {
    Write-Host "[SKIP] PocketBase already exists" -ForegroundColor Yellow
}

# 3. Install npm dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Cyan
Set-Location $projectRoot
npm install
Write-Host "[OK] npm dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Start the dev servers in two separate terminals:" -ForegroundColor White
Write-Host ""
Write-Host "  Terminal 1 (PocketBase):" -ForegroundColor Yellow
Write-Host "    npm run pocketbase" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Terminal 2 (React dev server):" -ForegroundColor Yellow
Write-Host "    npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then open:" -ForegroundColor White
Write-Host "  App:              http://localhost:3000" -ForegroundColor Cyan
Write-Host "  PocketBase Admin: http://localhost:8090/_/" -ForegroundColor Cyan
Write-Host ""
Write-Host "On first run, visit the PocketBase admin to create an admin account." -ForegroundColor Yellow
