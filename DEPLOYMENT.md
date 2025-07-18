# Spell Binder - Deployment Guide

## Overview

This guide covers deploying the Spell Binder application in various environments, from development to production. The application is containerized using Docker for easy deployment and includes security optimizations for production use.

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 1GB of available disk space
- Port 8080 available (or configure alternative port)

### Basic Deployment

1. Clone the repository:
```bash
git clone <repository-url>
cd spell-binder
```

2. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your preferred settings
```

3. Start the application:
```bash
docker-compose up -d
```

4. Access the application at `http://localhost:8080`

## Environment Configuration

### Required Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PB_ENCRYPTION_KEY` | Database encryption key (32+ chars) | Yes | - |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PB_ADMIN_EMAIL` | Pre-configure admin email | - |
| `PB_ADMIN_PASSWORD` | Pre-configure admin password | - |
| `HOST_PORT` | Host port mapping | 8080 |
| `CONTAINER_NAME` | Container name | spell-binder |
| `TIMEZONE` | Container timezone | UTC |
| `BACKUP_DIR` | Host backup directory | ./backups |
| `LOG_DIR` | Host log directory | ./logs |

### Generating Secure Keys

Generate a secure encryption key:
```bash
# Using OpenSSL
openssl rand -base64 32

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Deployment Scenarios

### Development Deployment

For development with hot reload and debugging:

```bash
# Start development environment
npm run dev

# In another terminal, start PocketBase
npm run pocketbase
```

Access:
- Frontend: `http://localhost:3000`
- PocketBase Admin: `http://localhost:8090/_/`

### Production Deployment

#### Option 1: Standard Production

```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d
```

#### Option 2: Production with SSL/Nginx

1. Set up SSL certificates using the provided script:
```bash
# Generate self-signed certificate (for testing)
bash scripts/setup-ssl.sh

# Or use Let's Encrypt (for production)
bash scripts/setup-ssl.sh -t letsencrypt -d your-domain.com -e admin@your-domain.com

# Or copy existing certificates
bash scripts/setup-ssl.sh -t existing --cert-file /path/to/cert.pem --key-file /path/to/key.pem
```

2. The nginx configuration is already provided in `nginx/nginx.conf` with:
   - SSL/TLS termination
   - Security headers
   - Rate limiting
   - Static asset caching
   - WebSocket support for real-time features

3. Deploy with nginx:
```bash
docker-compose -f docker-compose.prod.yml --profile nginx up -d
```

4. Verify SSL setup:
```bash
# Check certificate
openssl s509 -in nginx/ssl/cert.pem -text -noout

# Test HTTPS connection
curl -k https://localhost/api/health
```

## Security Considerations

### Production Security Checklist

- [ ] Generate strong `PB_ENCRYPTION_KEY` (32+ characters)
- [ ] Set strong admin credentials or use setup wizard
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules (only allow necessary ports)
- [ ] Regular security updates
- [ ] Configure backup strategy
- [ ] Monitor logs for suspicious activity
- [ ] Use non-root user (handled by container)
- [ ] Enable read-only filesystem (configured in compose)

### Network Security

The production configuration includes:
- Non-privileged container execution
- Read-only filesystem with specific writable mounts
- Security options to prevent privilege escalation
- Resource limits to prevent DoS attacks

### Data Security

- Database encryption using PocketBase's built-in encryption
- Secure environment variable handling
- Proper file permissions in container
- Volume isolation for data persistence

## Monitoring and Health Checks

### Health Check Endpoint

The application includes a health check endpoint at `/api/health` that:
- Verifies PocketBase is running
- Checks database connectivity
- Returns HTTP 200 on success

### Docker Health Checks

Configured health checks:
- **Interval**: 30s (15s in production)
- **Timeout**: 10s (5s in production)
- **Retries**: 3 (5 in production)
- **Start Period**: 40s (60s in production)

### Logging

Logs are configured with:
- JSON format for structured logging
- Log rotation (max 10MB per file, 3 files retained)
- Configurable log directory mounting

### Monitoring Commands

```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs -f spell-binder

# Check health status
docker inspect --format='{{.State.Health.Status}}' spell-binder

# Monitor resource usage
docker stats spell-binder

# Run comprehensive health check
npm run docker:health
# or directly:
bash scripts/health-check.sh

# Windows PowerShell health check
powershell -ExecutionPolicy Bypass -File scripts/health-check.ps1
```

## Backup and Recovery

### Database Backup

PocketBase stores data in SQLite files. Create backups:

```bash
# Create backup directory
mkdir -p backups

# Backup database (while container is running)
docker-compose exec spell-binder cp /pb/pb_data/data.db /backups/backup-$(date +%Y%m%d-%H%M%S).db

# Or backup entire data directory
docker cp spell-binder:/pb/pb_data ./backups/pb_data-$(date +%Y%m%d-%H%M%S)
```

### Automated Backup Script

The application includes comprehensive backup scripts:

```bash
# Create database backup
npm run backup
# or directly:
bash scripts/backup.sh

# Create full data backup (includes all PocketBase data)
npm run backup:full
# or directly:
bash scripts/backup.sh full

# List existing backups
npm run backup:list
# or directly:
bash scripts/backup.sh --list

# Custom backup with options
bash scripts/backup.sh database --retention 14 --verbose
```

The backup script features:
- Automatic compression (gzip)
- Configurable retention period (default: 7 days)
- Backup integrity verification
- Support for both database-only and full data backups
- Verbose logging and error handling

### Recovery

```bash
# Stop the application
docker-compose down

# Restore database
cp backups/backup-YYYYMMDD-HHMMSS.db ./pb_data/data.db

# Start the application
docker-compose up -d
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :8080

# Change port in .env file
HOST_PORT=8081
```

#### Permission Issues
```bash
# Fix volume permissions
sudo chown -R 1001:1001 ./pb_data
```

#### Container Won't Start
```bash
# Check logs
docker-compose logs spell-binder

# Check health status
docker inspect --format='{{.State.Health}}' spell-binder
```

#### Database Corruption
```bash
# Stop container
docker-compose down

# Restore from backup
cp backups/latest-backup.db ./pb_data/data.db

# Start container
docker-compose up -d
```

### Performance Tuning

#### Resource Limits

Adjust in `docker-compose.prod.yml`:
```yaml
deploy:
  resources:
    limits:
      memory: 1G
      cpus: '2.0'
    reservations:
      memory: 512M
      cpus: '1.0'
```

#### Database Optimization

PocketBase automatically handles most optimizations, but for large collections:
- Ensure adequate disk space
- Monitor memory usage
- Consider SSD storage for better performance

## Updating

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### PocketBase Updates

Update `PB_VERSION` in `.env` file and rebuild:
```bash
PB_VERSION=0.20.0
docker-compose up --build -d
```

## Support and Maintenance

### Regular Maintenance Tasks

- [ ] Weekly: Check logs for errors
- [ ] Weekly: Verify backups are working
- [ ] Monthly: Update dependencies and base images
- [ ] Monthly: Review security settings
- [ ] Quarterly: Test disaster recovery procedures

### Getting Help

1. Check the logs: `docker-compose logs -f`
2. Verify health checks: `docker inspect spell-binder`
3. Check resource usage: `docker stats`
4. Review this documentation
5. Check GitHub issues for known problems

## Advanced Configuration

### Custom PocketBase Hooks

Place custom hooks in `pocketbase/pb_hooks/` directory. They will be automatically copied to the container.

### Custom Migrations

Place migration files in `pocketbase/pb_migrations/` directory for automatic database schema updates.

### Environment-Specific Configurations

Create environment-specific compose files:
- `docker-compose.dev.yml` - Development
- `docker-compose.staging.yml` - Staging
- `docker-compose.prod.yml` - Production

Use with: `docker-compose -f docker-compose.prod.yml up -d`