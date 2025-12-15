# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy Prisma schema and migrations
COPY prisma ./prisma/

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy node_modules with Prisma Client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Generate Prisma Client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "Waiting for database..."' >> /app/start.sh && \
    echo 'sleep 5' >> /app/start.sh && \
    echo 'echo "Running migrations..."' >> /app/start.sh && \
    echo 'npx prisma migrate deploy' >> /app/start.sh && \
    echo 'echo "Starting server..."' >> /app/start.sh && \
    echo 'node dist/index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start application
CMD ["/app/start.sh"]
