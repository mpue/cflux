# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files first (better layer caching)
COPY package*.json ./

# Install dependencies with cache mount (this layer will be cached unless package.json changes)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit

# Copy config files
COPY tsconfig.json ./
COPY craco.config.js ./

# Copy environment files
COPY .env* ./

# Copy source code (changing source won't invalidate npm ci layer)
COPY public ./public
COPY src ./src

# Build the application with optimizations
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
