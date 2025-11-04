# Multi-stage build for Spell Binder
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with clean install for production
RUN npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Build the React application
RUN npm run build

# Production stage with security optimizations
FROM alpine:latest

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    ca-certificates \
    unzip \
    wget \
    zip \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create app directory with proper permissions
WORKDIR /pb

# Download and install PocketBase
ARG PB_VERSION=0.28.4
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
    && chmod +x pocketbase \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip

# Copy built React app from builder stage
COPY --from=builder /app/pocketbase/pb_public ./pb_public
COPY --from=builder /app/public/ ./pb_public

# Copy PocketBase hooks and migrations if they exist
COPY --from=builder /app/pocketbase/pb_hooks ./pb_hooks
COPY --from=builder /app/pocketbase/pb_migrations ./pb_migrations

# Create data directory for PocketBase database
RUN mkdir -p pb_data

# Environment variables with defaults
ENV PB_ENCRYPTION_KEY=""
ENV PB_ADMIN_EMAIL=""
ENV PB_ADMIN_PASSWORD=""
ENV PB_HTTP_ADDR="0.0.0.0:8080"
ENV PB_DATA_DIR="/pb/pb_data"
ENV PB_HOOKS_DIR="/pb/pb_hooks"
ENV PB_MIGRATIONS_DIR="/pb/pb_migrations"
ENV PB_PUBLIC_DIR="/pb/pb_public"

# Expose port
EXPOSE 8080

# Health check with improved reliability
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider --timeout=5 http://localhost:8080/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start PocketBase with environment variable support
CMD ["sh", "-c", "/pb/pocketbase serve --http=${PB_HTTP_ADDR} --dir=${PB_DATA_DIR} --hooksDir=${PB_HOOKS_DIR} --migrationsDir=${PB_MIGRATIONS_DIR} --publicDir=${PB_PUBLIC_DIR}"]