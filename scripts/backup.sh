#!/bin/bash

# Spell Binder Backup Script
# Automated backup solution for PocketBase data and configuration

set -e

# Configuration
CONTAINER_NAME="${CONTAINER_NAME:-spell-binder}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
COMPRESS="${COMPRESS:-true}"
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

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log "Creating backup directory: $BACKUP_DIR" "$YELLOW"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Check if container is running
check_container() {
    if ! docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
        log "✗ Container '${CONTAINER_NAME}' is not running" "$RED"
        exit 1
    fi
    log "✓ Container '${CONTAINER_NAME}' is running" "$GREEN"
}

# Create database backup
backup_database() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="backup-${timestamp}.db"
    local backup_path="${BACKUP_DIR}/${backup_file}"
    
    log "Creating database backup..." "$YELLOW"
    
    # Copy database from container
    if docker exec "$CONTAINER_NAME" test -f /pb/pb_data/data.db; then
        docker cp "${CONTAINER_NAME}:/pb/pb_data/data.db" "$backup_path"
        
        if [ "$COMPRESS" = "true" ]; then
            log "Compressing backup..." "$YELLOW"
            gzip "$backup_path"
            backup_path="${backup_path}.gz"
            backup_file="${backup_file}.gz"
        fi
        
        local size=$(du -h "$backup_path" | cut -f1)
        log "✓ Database backup created: $backup_file ($size)" "$GREEN"
        echo "$backup_path"
    else
        log "✗ Database file not found in container" "$RED"
        exit 1
    fi
}

# Create full data backup
backup_full_data() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="full-backup-${timestamp}.tar"
    local backup_path="${BACKUP_DIR}/${backup_file}"
    
    log "Creating full data backup..." "$YELLOW"
    
    # Create temporary directory for extraction
    local temp_dir=$(mktemp -d)
    
    # Copy entire pb_data directory
    docker cp "${CONTAINER_NAME}:/pb/pb_data" "$temp_dir/"
    
    # Create tar archive
    tar -cf "$backup_path" -C "$temp_dir" pb_data
    
    if [ "$COMPRESS" = "true" ]; then
        log "Compressing full backup..." "$YELLOW"
        gzip "$backup_path"
        backup_path="${backup_path}.gz"
        backup_file="${backup_file}.gz"
    fi
    
    # Cleanup temp directory
    rm -rf "$temp_dir"
    
    local size=$(du -h "$backup_path" | cut -f1)
    log "✓ Full data backup created: $backup_file ($size)" "$GREEN"
    echo "$backup_path"
}

# Verify backup integrity
verify_backup() {
    local backup_path="$1"
    
    log "Verifying backup integrity..." "$YELLOW"
    
    if [[ "$backup_path" == *.gz ]]; then
        if gzip -t "$backup_path"; then
            log "✓ Compressed backup integrity verified" "$GREEN"
        else
            log "✗ Compressed backup is corrupted" "$RED"
            return 1
        fi
    elif [[ "$backup_path" == *.tar* ]]; then
        if tar -tf "$backup_path" > /dev/null; then
            log "✓ Tar backup integrity verified" "$GREEN"
        else
            log "✗ Tar backup is corrupted" "$RED"
            return 1
        fi
    else
        # For SQLite database files
        if [ -f "$backup_path" ]; then
            log "✓ Database backup file exists" "$GREEN"
        else
            log "✗ Database backup file is missing" "$RED"
            return 1
        fi
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (older than $RETENTION_DAYS days)..." "$YELLOW"
    
    local deleted_count=0
    
    # Find and delete old backup files
    while IFS= read -r -d '' file; do
        if [ "$VERBOSE" = "true" ]; then
            log "Deleting old backup: $(basename "$file")" "$YELLOW"
        fi
        rm "$file"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "backup-*.db*" -o -name "full-backup-*.tar*" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [ $deleted_count -gt 0 ]; then
        log "✓ Deleted $deleted_count old backup(s)" "$GREEN"
    else
        log "✓ No old backups to clean up" "$GREEN"
    fi
}

# List existing backups
list_backups() {
    log "Existing backups:" "$YELLOW"
    
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
        ls -lh "$BACKUP_DIR" | grep -E "(backup-|full-backup-)" | while read -r line; do
            echo "  $line"
        done
    else
        log "  No backups found" "$YELLOW"
    fi
}

# Main backup function
main() {
    local backup_type="${1:-database}"
    
    log "Starting backup process..." "$YELLOW"
    
    create_backup_dir
    check_container
    
    local backup_path
    case "$backup_type" in
        "database"|"db")
            backup_path=$(backup_database)
            ;;
        "full")
            backup_path=$(backup_full_data)
            ;;
        *)
            log "✗ Unknown backup type: $backup_type" "$RED"
            log "Available types: database, full" "$YELLOW"
            exit 1
            ;;
    esac
    
    verify_backup "$backup_path"
    cleanup_old_backups
    
    if [ "$VERBOSE" = "true" ]; then
        list_backups
    fi
    
    log "✓ Backup process completed successfully" "$GREEN"
}

# Show usage
usage() {
    echo "Usage: $0 [TYPE] [OPTIONS]"
    echo ""
    echo "Backup Types:"
    echo "  database, db    Backup only the database file (default)"
    echo "  full           Backup entire pb_data directory"
    echo ""
    echo "Options:"
    echo "  -c, --container NAME    Container name (default: spell-binder)"
    echo "  -d, --dir PATH          Backup directory (default: ./backups)"
    echo "  -r, --retention DAYS    Retention period in days (default: 7)"
    echo "  --no-compress           Disable compression"
    echo "  -v, --verbose           Verbose output"
    echo "  -l, --list              List existing backups"
    echo "  -h, --help              Show this help"
    echo ""
    echo "Environment variables:"
    echo "  CONTAINER_NAME          Container name"
    echo "  BACKUP_DIR              Backup directory"
    echo "  RETENTION_DAYS          Retention period"
    echo "  COMPRESS                Enable compression (true/false)"
    echo "  VERBOSE                 Verbose output (true/false)"
    echo ""
    echo "Examples:"
    echo "  $0                      Create database backup"
    echo "  $0 full                 Create full data backup"
    echo "  $0 -v -r 14             Verbose backup with 14-day retention"
}

# Parse command line arguments
BACKUP_TYPE="database"
while [[ $# -gt 0 ]]; do
    case $1 in
        database|db|full)
            BACKUP_TYPE="$1"
            shift
            ;;
        -c|--container)
            CONTAINER_NAME="$2"
            shift 2
            ;;
        -d|--dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -r|--retention)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        --no-compress)
            COMPRESS="false"
            shift
            ;;
        -v|--verbose)
            VERBOSE="true"
            shift
            ;;
        -l|--list)
            create_backup_dir
            list_backups
            exit 0
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
main "$BACKUP_TYPE"