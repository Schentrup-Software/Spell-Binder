# Test script for image synchronization functionality
param([string]$PocketBaseUrl = "http://localhost:8090")

Write-Host "Testing Image Sync Functionality" -ForegroundColor Magenta

# Test 1: Check PocketBase connection
Write-Host "1. Testing PocketBase connection..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-RestMethod -Uri "$PocketBaseUrl/api/health" -Method "GET" -TimeoutSec 10
    Write-Host "✓ PocketBase is running" -ForegroundColor Green
}
catch {
    Write-Error "✗ Cannot connect to PocketBase at $PocketBaseUrl"
    exit 1
}

# Test 2: Check image sync progress endpoint
Write-Host "2. Testing image sync progress endpoint..." -ForegroundColor Yellow
try {
    $progressResponse = Invoke-RestMethod -Uri "$PocketBaseUrl/api/sync/images/progress" -Method "GET" -TimeoutSec 30
    
    Write-Host "✓ Image sync progress endpoint working" -ForegroundColor Green
    Write-Host "  Total cards with images: $($progressResponse.progress.total_with_images)" -ForegroundColor Cyan
    Write-Host "  Total cards needing images: $($progressResponse.progress.total_needing_images)" -ForegroundColor Cyan
    Write-Host "  Completion percentage: $($progressResponse.progress.completion_percentage)%" -ForegroundColor Cyan
    Write-Host "  Status: $($progressResponse.progress.status)" -ForegroundColor Cyan
}
catch {
    Write-Error "✗ Failed to test image sync progress endpoint: $($_.Exception.Message)"
}

Write-Host ""
Write-Host "Image sync functionality test completed!" -ForegroundColor Green