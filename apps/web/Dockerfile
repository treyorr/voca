FROM node:25.2.1-alpine AS builder
WORKDIR /app

# Copy root workspace config
COPY package.json package-lock.json ./

# Copy packages
COPY packages ./packages

# Copy app (ensure we don't assume external node_modules exist yet)
COPY apps/web ./apps/web

# Workaround for npm optional dependencies bug (https://github.com/npm/cli/issues/4828)
RUN rm -f package-lock.json && npm install

# Build packages in dependency order (client -> react)
# Note: svelte doesn't need a build step (exports .ts source)
RUN npm run build -w packages/voca-client && \
    npm run build -w packages/voca-react

# Build the web app
WORKDIR /app/apps/web
# VITE_VOCA_API_KEY is a public publishable key baked into the static bundle, not a secret credential
ARG VITE_VOCA_API_KEY
ENV VITE_VOCA_API_KEY=$VITE_VOCA_API_KEY
RUN npm run build

# Prune dev dependencies to keep image small
WORKDIR /app
RUN npm prune --omit=dev

FROM node:25.2.1-alpine
WORKDIR /app

# Copy production node_modules (including symlinks to packages)
COPY --from=builder /app/node_modules ./node_modules

# Copy package sources (targets of symlinks)
COPY --from=builder /app/packages ./packages

# Copy built application and config
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/build ./apps/web/build

# Run from the app directory
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["node", "build"]
