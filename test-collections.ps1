# Test script to verify PocketBase collections were created
Write-Host "Starting PocketBase to test collection creation..." -ForegroundColor Green

# Start PocketBase in background
$pb = Start-Process -FilePath "pocketbase/pocketbase.exe" -ArgumentList "serve", "--http=0.0.0.0:8090" -PassThru -WindowStyle Hidden

# Wait for PocketBase to start (longer delay for collection creation)
Start-Sleep -Seconds 6

try {
    # Test if PocketBase is running
    $health = Invoke-RestMethod -Uri "http://localhost:8090/api/health" -Method GET
    Write-Host "PocketBase is running: $($health.message)" -ForegroundColor Green
    
    # Try to access collections endpoint (this will fail without auth, but we can check the error)
    try {
        $collections = Invoke-RestMethod -Uri "http://localhost:8090/api/collections" -Method GET
    } catch {
        $errorResponse = $_.Exception.Response
        if ($errorResponse.StatusCode -eq 401) {
            Write-Host "Collections endpoint exists (401 Unauthorized as expected)" -ForegroundColor Yellow
        } else {
            Write-Host "Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    
    # Check if we can access individual collection endpoints
    $testCollections = @("collections", "cards", "sync_status")
    foreach ($collectionName in $testCollections) {
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:8090/api/collections/$collectionName/records" -Method GET
        } catch {
            $errorResponse = $_.Exception.Response
            if ($errorResponse.StatusCode -eq 401) {
                Write-Host "Collection '$collectionName' exists (401 Unauthorized as expected)" -ForegroundColor Green
            } elseif ($errorResponse.StatusCode -eq 404) {
                Write-Host "Collection '$collectionName' NOT FOUND" -ForegroundColor Red
            } else {
                Write-Host "Collection '$collectionName' - Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
    
} finally {
    # Stop PocketBase
    Stop-Process -Id $pb.Id -Force
    Write-Host "PocketBase stopped" -ForegroundColor Yellow
}