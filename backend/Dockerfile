# Backend: Express 4 + Mongoose 8 API (plain JS, no build step).
# Entry point: node src/server.js on port 5001.
FROM node:20-alpine

# dumb-init gives us a real PID 1 so SIGTERM from `docker stop` is
# forwarded to node for a clean shutdown.
RUN apk add --no-cache dumb-init

ENV NODE_ENV=production
WORKDIR /app

# Install production dependencies against the committed lockfile first so
# this layer is cached unless dependencies change.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Application source (includes src/seeds used by the one-shot seed service).
COPY src ./src

# Run as the built-in non-root user shipped with the node image.
USER node

EXPOSE 5001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
