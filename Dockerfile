# Multi-stage build for Spell Binder
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with clean install for production
RUN npm ci --only=production --no-audit --no-fund

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

# Create non-root user for security
RUN addgroup -g 1001 -S pocketbase && \
    adduser -S -D -H -u 1001 -s /sbin/nologin -G pocketbase pocketbase

# Create app directory with proper permissions
WORKDIR /pb
RUN chown -R pocketbase:pocketbase /pb

# Download and install PocketBase
ARG PB_VERSION=0.28.4
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip \
    && chmod +x pocketbase \
    && chown pocketbase:pocketbase pocketbase \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip

# Copy built React app from builder stage
COPY --from=builder /app/pocketbase/pb_public ./pb_public
RUN chown -R pocketbase:pocketbase ./pb_public

# Copy PocketBase hooks and migrations if they exist
COPY --from=builder /app/pocketbase/pb_hooks ./pb_hooks 2>/dev/null || true
COPY --from=builder /app/pocketbase/pb_migrations ./pb_migrations 2>/dev/null || true
RUN chown -R pocketbase:pocketbase ./pb_hooks ./pb_migrations 2>/dev/null || true

# Create data directory for PocketBase database with proper permissions
RUN mkdir -p pb_data && chown -R pocketbase:pocketbase pb_data

# Environment variables with defaults
ENV PB_ENCRYPTION_KEY=""
ENV PB_ADMIN_EMAIL=""
ENV PB_ADMIN_PASSWORD=""
ENV PB_HTTP_ADDR="0.0.0.0:8080"
ENV PB_DATA_DIR="/pb/pb_data"
ENV PB_HOOKS_DIR="/pb/pb_hooks"
ENV PB_MIGRATIONS_DIR="/pb/pb_migrations"
ENV PB_PUBLIC_DIR="/pb/pb_public"

# Switch to non-root user
USER pocketbase

# Expose port
EXPOSE 8080

# Health check with improved reliability
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider --timeout=5 http://localhost:8080/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start PocketBase with environment variable support
CMD ["sh", "-c", "./pocketbase serve --http=${PB_HTTP_ADDR} --dir=${PB_DATA_DIR} --hooksDir=${PB_HOOKS_DIR} --migrationsDir=${PB_MIGRATIONS_DIR} --publicDir=${PB_PUBLIC_DIR}"]