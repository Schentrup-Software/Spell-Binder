#!/bin/bash

# Spell Binder Health Check Script
# This script performs comprehensive health checks on the deployed application

set -e

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-spell-binder}"
HEALTH_ENDPOINT="${HEALTH_ENDPOINT:-http://localhost:8080/api/health}"
TIMEOUT="${TIMEOUT:-10}"
VERBOSE="${VERBOSE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${2:-$NC}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Check if container is running
check_container() {
    log "Checking container status..." "$YELLOW"
    
    if docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        log "✓ Container '${CONTAINER_NAME}' is running" "$GREEN"
        return 0
    else
        log "✗ Container '${CONTAINER_NAME}' is not running" "$RED"
        return 1
    fi
}

# Check container health status
check_docker_health() {
    log "Checking Docker health status..." "$YELLOW"
    
    local health_status
    health_status=$(docker inspect --format='{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null || echo "no-health-check")
    
    case "$health_status" in
        "healthy")
            log "✓ Docker health check: healthy" "$GREEN"
            return 0
            ;;
        "unhealthy")
            log "✗ Docker health check: unhealthy" "$RED"
            return 1
            ;;
        "starting")
            log "⚠ Docker health check: starting" "$YELLOW"
            return 1
            ;;
        "no-health-check")
            log "⚠ No Docker health check configured" "$YELLOW"
            return 0
            ;;
        *)
            log "✗ Unknown health status: $health_status" "$RED"
            return 1
            ;;
    esac
}

# Check HTTP endpoint
check_http_endpoint() {
    log "Checking HTTP endpoint..." "$YELLOW"
    
    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$HEALTH_ENDPOINT" || echo "000")
    
    if [ "$response_code" = "200" ]; then
        log "✓ HTTP endpoint responding (200 OK)" "$GREEN"
        return 0
    else
        log "✗ HTTP endpoint not responding (HTTP $response_code)" "$RED"
        return 1
    fi
}

# Check resource usage
check_resources() {
    log "Checking resource usage..." "$YELLOW"
    
    local stats
    stats=$(docker stats "$CONTAINER_NAME" --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || echo "N/A")
    
    if [ "$stats" != "N/A" ]; then
        log "✓ Resource usage: $stats" "$GREEN"
        return 0
    else
        log "⚠ Could not retrieve resource usage" "$YELLOW"
        return 0
    fi
}

# Check logs for errors
check_logs() {
    log "Checking recent logs for errors..." "$YELLOW"
    
    local error_count
    error_count=$(docker logs "$CONTAINER_NAME" --since="5m" 2>&1 | grep -i "error\|fatal\|panic" | wc -l)
    
    if [ "$error_count" -eq 0 ]; then
        log "✓ No recent errors in logs" "$GREEN"
        return 0
    else
        log "⚠ Found $error_count error(s) in recent logs" "$YELLOW"
        if [ "$VERBOSE" = "true" ]; then
            log "Recent errors:" "$YELLOW"
            docker logs "$CONTAINER_NAME" --since="5m" 2>&1 | grep -i "error\|fatal\|panic" | tail -5
        fi
        return 1
    fi
}

# Check disk space
check_disk_space() {
    log "Checking disk space..." "$YELLOW"
    
    local disk_usage
    disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -lt 90 ]; then
        log "✓ Disk usage: ${disk_usage}%" "$GREEN"
        return 0
    elif [ "$disk_usage" -lt 95 ]; then
        log "⚠ Disk usage: ${disk_usage}% (warning)" "$YELLOW"
        return 1
    else
        log "✗ Disk usage: ${disk_usage}% (critical)" "$RED"
        return 1
    fi
}

# Main health check function
main() {
    log "Starting health check for Spell Binder..." "$YELLOW"
    
    local exit_code=0
    
    # Run all checks
    check_container || exit_code=1
    check_docker_health || exit_code=1
    check_http_endpoint || exit_code=1
    check_resources || exit_code=1
    check_logs || exit_code=1
    check_disk_space || exit_code=1
    
    # Summary
    if [ $exit_code -eq 0 ]; then
        log "✓ All health checks passed" "$GREEN"
    else
        log "✗ Some health checks failed" "$RED"
    fi
    
    return $exit_code
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -c, --container NAME    Container name (default: spell-binder)"
    echo "  -e, --endpoint URL      Health endpoint URL (default: http://localhost:8080/api/health)"
    echo "  -t, --timeout SECONDS   HTTP timeout (default: 10)"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help"
    echo ""
    echo "Environment variables:"
    echo "  CONTAINER_NAME          Container name"
    echo "  HEALTH_ENDPOINT         Health endpoint URL"
    echo "  TIMEOUT                 HTTP timeout"
    echo "  VERBOSE                 Verbose output (true/false)"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--container)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        -e|--endpoint)
            HEALTH_ENDPOINT="$2"
            shift 2
            ;;
        -t|--timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        -v|--verbose)
            VERBOSE="true"
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Run main function
main
exit $?