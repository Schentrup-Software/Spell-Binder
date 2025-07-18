# PowerShell script to trigger MTG card data synchronization
# This script can be run manually or scheduled as a Windows task

param(
    [string]$PocketBaseUrl = "http://localhost:8090",
    [switch]$CheckStatus,
    [switch]$Force,
    [switch]$SyncImages
)

# Function to make HTTP requests
function Invoke-SyncRequest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{}
    )
    
    try {
        $response = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -TimeoutSec 300
        return $response
    }
    catch {
        Write-Error "HTTP request failed: $($_.Exception.Message)"
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode
            Write-Error "Status Code: $statusCode"
        }
        throw
    }
}

# Function to check sync status
function Get-SyncStatus {
    Write-Host "Checking sync status..." -ForegroundColor Yellow
    
    try {
        $statusUrl = "$PocketBaseUrl/api/sync/status"
        $response = Invoke-SyncRequest -Url $statusUrl -Method "GET"
        
        if ($response.success) {
            Write-Host "Sync Status:" -ForegroundColor Green
            foreach ($status in $response.sync_status) {
                Write-Host "  Data Type: $($status.data_type)" -ForegroundColor Cyan
                Write-Host "  Status: $($status.status)" -ForegroundColor $(if ($status.status -eq "success") { "Green" } elseif ($status.status -eq "failed") { "Red" } else { "Yellow" })
                Write-Host "  Last Sync: $($status.last_sync)" -ForegroundColor Gray
                Write-Host "  Records Processed: $($status.records_processed)" -ForegroundColor Gray
                if ($status.error_message) {
                    Write-Host "  Error: $($status.error_message)" -ForegroundColor Red
                }
                Write-Host ""
            }
        } else {
            Write-Error "Failed to get sync status: $($response.error)"
        }
    }
    catch {
        Write-Error "Failed to check sync status: $($_.Exception.Message)"
    }
}

# Function to trigger card sync
function Start-CardSync {
    param([bool]$IsScheduled = $false)
    
    $syncType = if ($IsScheduled) { "scheduled" } else { "manual" }
    Write-Host "Starting $syncType card synchronization..." -ForegroundColor Yellow
    
    try {
        $syncUrl = if ($IsScheduled) { "$PocketBaseUrl/api/sync/scheduled" } else { "$PocketBaseUrl/api/sync/cards" }
        
        Write-Host "Triggering sync at: $syncUrl" -ForegroundColor Gray
        $response = Invoke-SyncRequest -Url $syncUrl -Method "POST"
        
        if ($response.success) {
            Write-Host "Sync completed successfully!" -ForegroundColor Green
            Write-Host "Records processed: $($response.records_processed)" -ForegroundColor Cyan
            Write-Host "Message: $($response.message)" -ForegroundColor Gray
        } else {
            Write-Error "Sync failed: $($response.error)"
            exit 1
        }
    }
    catch {
        Write-Error "Failed to trigger sync: $($_.Exception.Message)"
        exit 1
    }
}

# Main script logic
Write-Host "Spell Binder - Card Data Sync" -ForegroundColor Magenta
Write-Host "=======================================" -ForegroundColor Magenta

# Check if PocketBase is running
try {
    Write-Host "Checking PocketBase connection at $PocketBaseUrl..." -ForegroundColor Gray
    $healthCheck = Invoke-RestMethod -Uri "$PocketBaseUrl/api/health" -Method "GET" -TimeoutSec 10
    Write-Host "PocketBase is running" -ForegroundColor Green
}
catch {
    Write-Error "Cannot connect to PocketBase at $PocketBaseUrl"
    Write-Host "Make sure PocketBase is running and accessible at the specified URL" -ForegroundColor Yellow
    exit 1
}

# Function to trigger image sync
function Start-ImageSync {
    Write-Host "Starting image synchronization..." -ForegroundColor Yellow
    
    try {
        $syncUrl = "$PocketBaseUrl/api/sync/images"
        
        Write-Host "Triggering image sync at: $syncUrl" -ForegroundColor Gray
        $response = Invoke-SyncRequest -Url $syncUrl -Method "POST"
        
        if ($response.success) {
            Write-Host "Image sync completed successfully!" -ForegroundColor Green
            Write-Host "Images processed: $($response.processed)" -ForegroundColor Cyan
            Write-Host "Message: $($response.message)" -ForegroundColor Gray
        } else {
            Write-Error "Image sync failed: $($response.error)"
            exit 1
        }
    }
    catch {
        Write-Error "Failed to trigger image sync: $($_.Exception.Message)"
        exit 1
    }
}

# Handle different script modes
if ($CheckStatus) {
    Get-SyncStatus
}
elseif ($SyncImages) {
    # Only sync images
    Start-ImageSync
}
elseif ($Force) {
    # Force sync regardless of current status
    Start-CardSync -IsScheduled $false
    
    # Also sync images if requested
    if ($SyncImages) {
        Start-ImageSync
    }
}
else {
    # Check current status first
    Write-Host "Checking current sync status before starting..." -ForegroundColor Gray
    
    try {
        $statusResponse = Invoke-SyncRequest -Url "$PocketBaseUrl/api/sync/status" -Method "GET"
        
        if ($statusResponse.success) {
            $cardsStatus = $statusResponse.sync_status | Where-Object { $_.data_type -eq "cards" }
            
            if ($cardsStatus -and $cardsStatus.status -eq "in_progress") {
                Write-Warning "A sync is already in progress. Use -Force to override or -CheckStatus to monitor."
                exit 0
            }
        }
    }
    catch {
        Write-Warning "Could not check current status, proceeding with sync..."
    }
    
    # Start scheduled sync (checks for conflicts)
    Start-CardSync -IsScheduled $true
    
    # Also sync images if requested
    if ($SyncImages) {
        Start-ImageSync
    }
}

Write-Host "Script completed" -ForegroundColor Green