# NOTE: Build this from the monorepo root: docker build -t voca-web -f apps/web/Dockerfile .
FROM oven/bun:1.3.5-alpine AS builder
WORKDIR /app

# Copy only web app files (packages come from npm)
COPY apps/web/package.json apps/web/bun.lockb* ./

# Install dependencies from npm
RUN bun install

# Copy app source
COPY apps/web ./

# Build the web app
# VITE_VOCA_API_KEY is a public publishable key baked into the static bundle
ARG VITE_VOCA_API_KEY
ENV VITE_VOCA_API_KEY=$VITE_VOCA_API_KEY
RUN bun run build

# Production stage
FROM oven/bun:1.3.5-alpine
WORKDIR /app

# Copy built application and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/build ./build

EXPOSE 3000
CMD ["bun", "build/index.js"]
