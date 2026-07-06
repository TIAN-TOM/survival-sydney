# Backend: Express 4 + Mongoose 8 API (TypeScript, compiled to dist/ by tsc).
# Entry point: node dist/server.js on port 5001.

# ---- Stage 1: install all deps and compile TypeScript ----
FROM node:20-alpine AS build

WORKDIR /app

# Install against the committed lockfile first so this layer is cached
# unless dependencies change. Dev deps are needed here for tsc.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src
# Compiles src -> dist (tests excluded); imported seed JSON is emitted into dist too.
RUN npm run build

# ---- Stage 2: production runtime with only prod deps + compiled output ----
FROM node:20-alpine

# dumb-init gives us a real PID 1 so SIGTERM from `docker stop` is
# forwarded to node for a clean shutdown.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled application (includes dist/seeds used by the one-shot seed service).
COPY --from=build /app/dist ./dist

# Run as the built-in non-root user shipped with the node image.
USER node

EXPOSE 5001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
