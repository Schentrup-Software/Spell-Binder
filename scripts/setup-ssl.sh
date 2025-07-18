#!/bin/bash

# SSL Certificate Setup Script for Spell Binder
# This script helps set up SSL certificates for production deployment

set -e

# Configuration
SSL_DIR="${SSL_DIR:-./nginx/ssl}"
DOMAIN="${DOMAIN:-localhost}"
CERT_TYPE="${CERT_TYPE:-self-signed}"
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

# Create SSL directory
create_ssl_dir() {
    if [ ! -d "$SSL_DIR" ]; then
        log "Creating SSL directory: $SSL_DIR" "$YELLOW"
        mkdir -p "$SSL_DIR"
    fi
}

# Generate self-signed certificate
generate_self_signed() {
    log "Generating self-signed certificate for $DOMAIN..." "$YELLOW"
    
    # Create certificate configuration
    cat > "$SSL_DIR/cert.conf" << EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=US
ST=State
L=City
O=Organization
CN=$DOMAIN

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
IP.1 = 127.0.0.1
EOF

    # Generate private key
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # Generate certificate
    openssl req -new -x509 -key "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" -days 365 -config "$SSL_DIR/cert.conf" -extensions v3_req
    
    # Set proper permissions
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    # Clean up config file
    rm "$SSL_DIR/cert.conf"
    
    log "✓ Self-signed certificate generated successfully" "$GREEN"
    log "Certificate: $SSL_DIR/cert.pem" "$GREEN"
    log "Private key: $SSL_DIR/key.pem" "$GREEN"
    log "⚠ Warning: Self-signed certificates will show security warnings in browsers" "$YELLOW"
}

# Setup Let's Encrypt certificate
setup_letsencrypt() {
    log "Setting up Let's Encrypt certificate for $DOMAIN..." "$YELLOW"
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        log "✗ Certbot is not installed. Please install certbot first." "$RED"
        log "Ubuntu/Debian: sudo apt-get install certbot" "$YELLOW"
        log "CentOS/RHEL: sudo yum install certbot" "$YELLOW"
        log "macOS: brew install certbot" "$YELLOW"
        exit 1
    fi
    
    # Generate certificate using standalone mode
    log "Requesting certificate from Let's Encrypt..." "$YELLOW"
    log "⚠ Make sure port 80 is accessible from the internet" "$YELLOW"
    
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "${EMAIL:-admin@${DOMAIN}}" \
        -d "$DOMAIN"
    
    # Copy certificates to nginx directory
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/cert.pem"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/key.pem"
    
    # Set proper permissions
    chmod 644 "$SSL_DIR/cert.pem"
    chmod 600 "$SSL_DIR/key.pem"
    
    log "✓ Let's Encrypt certificate installed successfully" "$GREEN"
    log "Certificate: $SSL_DIR/cert.pem" "$GREEN"
    log "Private key: $SSL_DIR/key.pem" "$GREEN"
    log "⚠ Remember to set up certificate renewal" "$YELLOW"
}

# Copy existing certificates
copy_existing() {
    local cert_path="$1"
    local key_path="$2"
    
    if [ ! -f "$cert_path" ] || [ ! -f "$key_path" ]; then
        log "✗ Certificate or key file not found" "$RED"
        log "Certificate: $cert_path" "$RED"
        log "Key: $key_path" "$RED"
        exit 1
    fi
    
    log "Copying existing certificates..." "$YELLOW"
    
    cp "$cert_path" "$SSL_DIR/cert.pem"
    cp "$key_path" "$SSL_DIR/key.pem"
    
    # Set proper permissions
    chmod 644 "$SSL_DIR/cert.pem"
    chmod 600 "$SSL_DIR/key.pem"
    
    log "✓ Certificates copied successfully" "$GREEN"
}

# Verify certificates
verify_certificates() {
    log "Verifying certificates..." "$YELLOW"
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        log "✗ Certificate files not found" "$RED"
        return 1
    fi
    
    # Check certificate validity
    if openssl x509 -in "$SSL_DIR/cert.pem" -text -noout > /dev/null 2>&1; then
        log "✓ Certificate is valid" "$GREEN"
    else
        log "✗ Certificate is invalid" "$RED"
        return 1
    fi
    
    # Check private key
    if openssl rsa -in "$SSL_DIR/key.pem" -check -noout > /dev/null 2>&1; then
        log "✓ Private key is valid" "$GREEN"
    else
        log "✗ Private key is invalid" "$RED"
        return 1
    fi
    
    # Check if certificate and key match
    cert_hash=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
    key_hash=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" | openssl md5)
    
    if [ "$cert_hash" = "$key_hash" ]; then
        log "✓ Certificate and private key match" "$GREEN"
    else
        log "✗ Certificate and private key do not match" "$RED"
        return 1
    fi
    
    # Show certificate information
    if [ "$VERBOSE" = "true" ]; then
        log "Certificate information:" "$YELLOW"
        openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:|IP Address:)"
    fi
    
    return 0
}

# Main function
main() {
    log "Starting SSL certificate setup..." "$YELLOW"
    
    create_ssl_dir
    
    case "$CERT_TYPE" in
        "self-signed")
            generate_self_signed
            ;;
        "letsencrypt")
            setup_letsencrypt
            ;;
        "existing")
            if [ -z "$CERT_FILE" ] || [ -z "$KEY_FILE" ]; then
                log "✗ CERT_FILE and KEY_FILE must be specified for existing certificates" "$RED"
                exit 1
            fi
            copy_existing "$CERT_FILE" "$KEY_FILE"
            ;;
        *)
            log "✗ Unknown certificate type: $CERT_TYPE" "$RED"
            log "Available types: self-signed, letsencrypt, existing" "$YELLOW"
            exit 1
            ;;
    esac
    
    verify_certificates
    
    log "✓ SSL certificate setup completed successfully" "$GREEN"
    log "You can now start the application with SSL support:" "$YELLOW"
    log "docker-compose -f docker-compose.prod.yml --profile nginx up -d" "$YELLOW"
}

# Show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Certificate Types:"
    echo "  self-signed     Generate self-signed certificate (default)"
    echo "  letsencrypt     Use Let's Encrypt (requires internet access)"
    echo "  existing        Copy existing certificate files"
    echo ""
    echo "Options:"
    echo "  -t, --type TYPE         Certificate type"
    echo "  -d, --domain DOMAIN     Domain name (default: localhost)"
    echo "  -e, --email EMAIL       Email for Let's Encrypt"
    echo "  --cert-file PATH        Path to existing certificate file"
    echo "  --key-file PATH         Path to existing private key file"
    echo "  --ssl-dir PATH          SSL directory (default: ./nginx/ssl)"
    echo "  -v, --verbose           Verbose output"
    echo "  -h, --help              Show this help"
    echo ""
    echo "Environment variables:"
    echo "  DOMAIN                  Domain name"
    echo "  CERT_TYPE               Certificate type"
    echo "  EMAIL                   Email for Let's Encrypt"
    echo "  SSL_DIR                 SSL directory"
    echo "  CERT_FILE               Existing certificate file"
    echo "  KEY_FILE                Existing private key file"
    echo ""
    echo "Examples:"
    echo "  $0                                          # Generate self-signed certificate"
    echo "  $0 -t letsencrypt -d example.com           # Use Let's Encrypt"
    echo "  $0 -t existing --cert-file cert.pem --key-file key.pem"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--type)
            CERT_TYPE="$2"
            shift 2
            ;;
        -d|--domain)
            DOMAIN="$2"
            shift 2
            ;;
        -e|--email)
            EMAIL="$2"
            shift 2
            ;;
        --cert-file)
            CERT_FILE="$2"
            shift 2
            ;;
        --key-file)
            KEY_FILE="$2"
            shift 2
            ;;
        --ssl-dir)
            SSL_DIR="$2"
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

# Check dependencies
if ! command -v openssl &> /dev/null; then
    log "✗ OpenSSL is not installed. Please install OpenSSL first." "$RED"
    exit 1
fi

# Run main function
main