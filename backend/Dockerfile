# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (bcrypt, etc.) and OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code (exclude __tests__)
COPY src ./src
RUN rm -rf ./src/__tests__

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (bcrypt, etc.) and OpenSSL for Prisma
RUN apk add --no-cache openssl python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Copy scripts folder for installation
COPY scripts ./scripts/

# Copy tsconfig for scripts compilation
COPY tsconfig.json ./

# Install dependencies needed for setup scripts
RUN npm install -D typescript @types/node

# Compile setup scripts to JavaScript
RUN npx tsc scripts/setup-admin.ts scripts/install.ts --outDir dist/scripts --module commonjs --esModuleInterop --skipLibCheck --resolveJsonModule

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy node_modules with Prisma Client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Create startup script with installation check
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "🚀 Time Tracking System - Starting..."' >> /app/start.sh && \
    echo 'echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo 'echo "⏳ Waiting for database..."' >> /app/start.sh && \
    echo 'sleep 5' >> /app/start.sh && \
    echo 'echo "✅ Database ready"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo 'echo "📦 Synchronizing database schema..."' >> /app/start.sh && \
    echo 'if ! npx prisma db push --skip-generate; then' >> /app/start.sh && \
    echo '  echo "❌ Schema sync failed - stopping"' >> /app/start.sh && \
    echo '  exit 1' >> /app/start.sh && \
    echo 'fi' >> /app/start.sh && \
    echo 'echo "✅ Database schema synchronized"' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo 'echo "🔍 Checking installation status..."' >> /app/start.sh && \
    echo 'node dist/scripts/install.js' >> /app/start.sh && \
    echo 'echo ""' >> /app/start.sh && \
    echo 'echo "🌐 Starting server..."' >> /app/start.sh && \
    echo 'node dist/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start application
CMD ["/app/start.sh"]
