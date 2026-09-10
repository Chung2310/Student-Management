# Step 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package.json package-lock.json ./

# Install ALL dependencies
ENV NODE_ENV=development
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# Copy the entire workspace
COPY . .

# Build both frontend Vite SPA and backend bundled with esbuild
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# Step 2: Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy compiled resources and package configuration
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/package-lock.json ./

# Install only production dependencies
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --no-audit --no-fund

# Expose production port
EXPOSE 3001

# Run the ES module server
CMD ["node", "dist/server.js"]
