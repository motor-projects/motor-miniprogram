# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Create non-root user
RUN adduser -D -s /bin/sh motor

# Change ownership of nginx directories
RUN chown -R motor:motor /var/cache/nginx && \
    chown -R motor:motor /var/log/nginx && \
    chown -R motor:motor /etc/nginx/conf.d

# Change ownership of web files
RUN chown -R motor:motor /usr/share/nginx/html

# Switch to non-root user
USER motor

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]