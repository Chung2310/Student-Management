# Step 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package management files
COPY package.json yarn.lock ./

# Install ALL dependencies
ENV NODE_ENV=development
RUN --mount=type=cache,target=/root/.yarn-cache \
    yarn install --frozen-lockfile --cache-folder /root/.yarn-cache

# Copy the entire workspace
COPY . .

# Remove package-lock.json if it exists to avoid conflicts
RUN rm -f package-lock.json

# Build both frontend Vite SPA and backend bundled with esbuild
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN yarn build

# Step 2: Production runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy compiled resources and package configuration
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json /app/yarn.lock ./

# Install only production dependencies
RUN --mount=type=cache,target=/root/.yarn-cache \
    yarn install --production --frozen-lockfile --cache-folder /root/.yarn-cache

# Expose production port
EXPOSE 3001

# Run the ES module server
CMD ["node", "dist/server.js"]
