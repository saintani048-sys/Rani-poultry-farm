# Multi-stage Dockerfile for Noorani Poultry Farm
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm ci

# Copy application source code
COPY . .

# Build frontend and server
RUN npm run build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build artifacts and assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/assets ./src/assets
COPY --from=builder /app/index.html ./index.html

# Expose server port
EXPOSE 3000

# Start server
CMD ["node", "dist/server.js"]
