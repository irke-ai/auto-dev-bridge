# Multi-stage build for production optimization
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install all dependencies
RUN npm ci --only=production --silent

# Install client dependencies and build
WORKDIR /app/client
RUN npm ci --silent
COPY client/ ./
RUN npm run build

# Production stage
FROM node:18-alpine as production

# Create app directory
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S autodev -u 1001

# Copy server package files
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --only=production --silent

# Copy server source code
COPY server/src/ ./src/

# Copy client build files to serve statically
COPY --from=builder /app/client/dist/ ./public/

# Create data directory with proper permissions
RUN mkdir -p /app/data/requests /app/data/responses /app/data/history
RUN mkdir -p /app/data/requests/archive /app/data/responses/archive

# Initialize data files
RUN echo '{"requests":[],"metadata":{"created":"'$(date -Iseconds)'","version":"1.0.0"}}' > /app/data/requests/active.json
RUN echo '{"responses":[],"metadata":{"created":"'$(date -Iseconds)'","version":"1.0.0"}}' > /app/data/responses/latest.json

# Set proper ownership
RUN chown -R autodev:nodejs /app
USER autodev

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV CORS_ORIGIN=http://localhost:5173
ENV DATA_PATH=/app/data
# API key will be passed at runtime

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "src/index.js"]