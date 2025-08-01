# Production stage with security optimizations
FROM alpine:latest

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    ca-certificates \
    unzip \
    wget \
    zip \
    git \
    sqlite3 \
    && rm -rf /var/cache/apk/*

#Install nodejs and npm
RUN apk add --no-cache nodejs npm

# Create app directory with proper permissions
WORKDIR /pb

# Download and install PocketBase
ARG PB_VERSION=0.28.4
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip

# Environment variables with defaults
ENV PB_ENCRYPTION_KEY="your-secure-encryption-key-here-32-chars-minimum"
ENV PB_ADMIN_EMAIL="admin@example.com"
ENV PB_ADMIN_PASSWORD="password"
ENV PB_HTTP_ADDR="0.0.0.0:8090"
ENV PB_DATA_DIR="/workspaces/Spell-Binder/pocketbase/pb_data"
ENV PB_HOOKS_DIR="/workspaces/Spell-Binder/pocketbase/pb_hooks"
ENV PB_MIGRATIONS_DIR="/workspaces/Spell-Binder/pocketbase/pb_migrations"
ENV PB_PUBLIC_DIR="/workspaces/Spell-Binder/pocketbase/pb_public"

# Expose port
EXPOSE 8090
