# Development setup script for Windows
# This script downloads PocketBase and sets up the development environment

$PB_VERSION = "0.19.4"
$PB_DIR = "pocketbase"

Write-Host "Setting up Spell Binder development environment..." -ForegroundColor Green

# Create pocketbase directory if it doesn't exist
if (!(Test-Path $PB_DIR)) {
    New-Item -ItemType Directory -Path $PB_DIR
}

# Download PocketBase if not already present
$PB_EXE = "$PB_DIR/pocketbase.exe"
if (!(Test-Path $PB_EXE)) {
    Write-Host "Downloading PocketBase v$PB_VERSION..." -ForegroundColor Yellow
    $downloadUrl = "https://github.com/pocketbase/pocketbase/releases/download/v$PB_VERSION/pocketbase_${PB_VERSION}_windows_amd64.zip"
    $zipFile = "$PB_DIR/pocketbase.zip"
    
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile
    Expand-Archive -Path $zipFile -DestinationPath $PB_DIR -Force
    Remove-Item $zipFile
    
    Write-Host "PocketBase downloaded successfully!" -ForegroundColor Green
} else {
    Write-Host "PocketBase already exists, skipping download." -ForegroundColor Yellow
}

# Install npm dependencies
Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
npm install

Write-Host "Development environment setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start development:" -ForegroundColor Cyan
Write-Host "1. Run 'npm run pocketbase' in one terminal (starts PocketBase on port 8090)"
Write-Host "2. Run 'npm run dev' in another terminal (starts React dev server on port 3000)"
Write-Host ""
Write-Host "PocketBase admin UI will be available at: http://localhost:8090/_/"
Write-Host "React development server will be available at: http://localhost:3000"