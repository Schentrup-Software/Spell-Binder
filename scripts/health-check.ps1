# Spell Binder Health Check Script (PowerShell)
# This script performs comprehensive health checks on the deployed application

param(
    [string]$ContainerName = $env:CONTAINER_NAME ?? "spell-binder",
    [string]$HealthEndpoint = $env:HEALTH_ENDPOINT ?? "http://localhost:8080/api/health",
    [int]$Timeout = [int]($env:TIMEOUT ?? 10),
    [switch]$Verbose
)

# Set verbose preference
if ($Verbose) {
    $VerbosePreference = "Continue"
}

# Function to write colored output
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Check if container is running
function Test-Container {
    Write-ColorOutput "Checking container status..." "Yellow"
    
    try {
        $containers = docker ps --format "table {{.Names}}" | Select-String "^$ContainerName$"
        if ($containers) {
            Write-ColorOutput "✓ Container '$ContainerName' is running" "Green"
            return $true
        } else {
            Write-ColorOutput "✗ Container '$ContainerName' is not running" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "✗ Error checking container status: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Check container health status
function Test-DockerHealth {
    Write-ColorOutput "Checking Docker health status..." "Yellow"
    
    try {
        $healthStatus = docker inspect --format='{{.State.Health.Status}}' $ContainerName 2>$null
        if (-not $healthStatus) {
            $healthStatus = "no-health-check"
        }
        
        switch ($healthStatus) {
            "healthy" {
                Write-ColorOutput "✓ Docker health check: healthy" "Green"
                return $true
            }
            "unhealthy" {
                Write-ColorOutput "✗ Docker health check: unhealthy" "Red"
                return $false
            }
            "starting" {
                Write-ColorOutput "⚠ Docker health check: starting" "Yellow"
                return $false
            }
            "no-health-check" {
                Write-ColorOutput "⚠ No Docker health check configured" "Yellow"
                return $true
            }
            default {
                Write-ColorOutput "✗ Unknown health status: $healthStatus" "Red"
                return $false
            }
        }
    } catch {
        Write-ColorOutput "✗ Error checking Docker health: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Check HTTP endpoint
function Test-HttpEndpoint {
    Write-ColorOutput "Checking HTTP endpoint..." "Yellow"
    
    try {
        $response = Invoke-WebRequest -Uri $HealthEndpoint -TimeoutSec $Timeout -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✓ HTTP endpoint responding (200 OK)" "Green"
            return $true
        } else {
            Write-ColorOutput "✗ HTTP endpoint not responding (HTTP $($response.StatusCode))" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "✗ HTTP endpoint not responding: $($_.Exception.Message)" "Red"
        return $false
    }
}

# Check resource usage
function Test-Resources {
    Write-ColorOutput "Checking resource usage..." "Yellow"
    
    try {
        $stats = docker stats $ContainerName --no-stream --format "table {{.CPUPerc}}`t{{.MemUsage}}" 2>$null
        if ($stats -and $stats -ne "N/A") {
            Write-ColorOutput "✓ Resource usage: $stats" "Green"
            return $true
        } else {
            Write-ColorOutput "⚠ Could not retrieve resource usage" "Yellow"
            return $true
        }
    } catch {
        Write-ColorOutput "⚠ Could not retrieve resource usage: $($_.Exception.Message)" "Yellow"
        return $true
    }
}

# Check logs for errors
function Test-Logs {
    Write-ColorOutput "Checking recent logs for errors..." "Yellow"
    
    try {
        $logs = docker logs $ContainerName --since="5m" 2>&1
        $errorCount = ($logs | Select-String -Pattern "error|fatal|panic" -CaseSensitive:$false).Count
        
        if ($errorCount -eq 0) {
            Write-ColorOutput "✓ No recent errors in logs" "Green"
            return $true
        } else {
            Write-ColorOutput "⚠ Found $errorCount error(s) in recent logs" "Yellow"
            if ($Verbose) {
                Write-ColorOutput "Recent errors:" "Yellow"
                $logs | Select-String -Pattern "error|fatal|panic" -CaseSensitive:$false | Select-Object -Last 5 | ForEach-Object {
                    Write-Host "  $($_.Line)" -ForegroundColor Red
                }
            }
            return $false
        }
    } catch {
        Write-ColorOutput "⚠ Could not check logs: $($_.Exception.Message)" "Yellow"
        return $true
    }
}

# Check disk space
function Test-DiskSpace {
    Write-ColorOutput "Checking disk space..." "Yellow"
    
    try {
        $drive = Get-PSDrive -Name (Get-Location).Drive.Name
        $usedPercent = [math]::Round((($drive.Used / ($drive.Used + $drive.Free)) * 100), 2)
        
        if ($usedPercent -lt 90) {
            Write-ColorOutput "✓ Disk usage: $usedPercent%" "Green"
            return $true
        } elseif ($usedPercent -lt 95) {
            Write-ColorOutput "⚠ Disk usage: $usedPercent% (warning)" "Yellow"
            return $false
        } else {
            Write-ColorOutput "✗ Disk usage: $usedPercent% (critical)" "Red"
            return $false
        }
    } catch {
        Write-ColorOutput "⚠ Could not check disk space: $($_.Exception.Message)" "Yellow"
        return $true
    }
}

# Main health check function
function Start-HealthCheck {
    Write-ColorOutput "Starting health check for Spell Binder..." "Yellow"
    
    $allPassed = $true
    
    # Run all checks
    if (-not (Test-Container)) { $allPassed = $false }
    if (-not (Test-DockerHealth)) { $allPassed = $false }
    if (-not (Test-HttpEndpoint)) { $allPassed = $false }
    if (-not (Test-Resources)) { $allPassed = $false }
    if (-not (Test-Logs)) { $allPassed = $false }
    if (-not (Test-DiskSpace)) { $allPassed = $false }
    
    # Summary
    if ($allPassed) {
        Write-ColorOutput "✓ All health checks passed" "Green"
        exit 0
    } else {
        Write-ColorOutput "✗ Some health checks failed" "Red"
        exit 1
    }
}

# Show usage
function Show-Usage {
    Write-Host @"
Usage: .\health-check.ps1 [OPTIONS]

Options:
  -ContainerName NAME     Container name (default: spell-binder)
  -HealthEndpoint URL     Health endpoint URL (default: http://localhost:8080/api/health)
  -Timeout SECONDS        HTTP timeout (default: 10)
  -Verbose               Verbose output
  -Help                  Show this help

Environment variables:
  CONTAINER_NAME          Container name
  HEALTH_ENDPOINT         Health endpoint URL
  TIMEOUT                 HTTP timeout
  VERBOSE                 Verbose output (true/false)

Examples:
  .\health-check.ps1
  .\health-check.ps1 -ContainerName "my-catalog" -Verbose
  .\health-check.ps1 -HealthEndpoint "http://localhost:8081/api/health"
"@
}

# Handle help parameter
if ($args -contains "-Help" -or $args -contains "--help" -or $args -contains "-h") {
    Show-Usage
    exit 0
}

# Run main function
Start-HealthCheck