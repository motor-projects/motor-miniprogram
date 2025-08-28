FROM node:18-alpine

# Set working directory
WORKDIR /app

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S motor -u 1001

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY --chown=motor:nodejs . .

# Create uploads directory
RUN mkdir -p uploads && chown -R motor:nodejs uploads

# Create logs directory
RUN mkdir -p logs && chown -R motor:nodejs logs

# Switch to non-root user
USER motor

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]