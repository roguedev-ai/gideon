# Gideon Frontend - Production Dockerfile
# Builds the React application for production deployment

# Multi-stage build for optimized production image

# Stage 1: Build Environment
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies with comprehensive fixes for version conflicts
RUN npm cache clean --force && \
    rm -rf node_modules package-lock.json && \
    npm install --legacy-peer-deps --unsafe-perm=true --allow-root || \
    (npm install --force --legacy-peer-deps --unsafe-perm=true --allow-root && \
     npm rebuild ajv ajv-keywords)

# Copy source code
COPY . ./

# Build the application for production
RUN npm run build

# Stage 2: Production Environment (Nginx)
FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy built application from builder stage
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
