FROM oven/bun:1.3.5-alpine AS builder
WORKDIR /app

# Copy root workspace config
COPY package.json bun.lockb* ./

# Copy packages
COPY packages ./packages

# Copy app
COPY apps/web ./apps/web

# Install dependencies
RUN bun install

# Build packages in dependency order
RUN cd packages/voca-client && bun run build && \
    cd ../voca-react && bun run build && \
    cd ../voca-svelte && bun run build

# Build the web app
WORKDIR /app/apps/web
# VITE_VOCA_API_KEY is a public publishable key baked into the static bundle, not a secret credential
ARG VITE_VOCA_API_KEY
ENV VITE_VOCA_API_KEY=$VITE_VOCA_API_KEY
RUN bun run build

# Production stage
FROM oven/bun:1.3.5-alpine
WORKDIR /app

# Copy node_modules with workspace links
COPY --from=builder /app/node_modules ./node_modules

# Copy package sources
COPY --from=builder /app/packages ./packages

# Copy built application and config
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/build ./apps/web/build

# Run from the app directory
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["bun", "run", "build/index.js"]
