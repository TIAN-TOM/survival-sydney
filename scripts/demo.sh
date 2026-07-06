#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MONGO_CONTAINER_NAME="${MONGO_CONTAINER_NAME:-openassess-mongo}"
MONGO_IMAGE="${MONGO_IMAGE:-mongo:7}"
MONGO_HOST="${MONGO_HOST:-127.0.0.1}"
MONGO_PORT="${MONGO_PORT:-27017}"

log() {
  printf '\n[%s] %s\n' "demo" "$1"
}

mongo_ready() {
  if command -v nc >/dev/null 2>&1; then
    nc -z "$MONGO_HOST" "$MONGO_PORT" >/dev/null 2>&1
    return $?
  fi

  node - <<'NODE' >/dev/null 2>&1
const net = require('net');
const host = process.env.MONGO_HOST || '127.0.0.1';
const port = Number(process.env.MONGO_PORT || 27017);
const socket = net.createConnection({ host, port });
socket.setTimeout(1000);
socket.on('connect', () => {
  socket.destroy();
  process.exit(0);
});
socket.on('timeout', () => {
  socket.destroy();
  process.exit(1);
});
socket.on('error', () => process.exit(1));
NODE
}

ensure_env_files() {
  log "Preparing local environment files"

  if [ ! -f "$ROOT_DIR/backend/.env" ]; then
    # Generate a fresh JWT secret instead of copying the placeholder, which the app now rejects.
    local secret
    if command -v openssl >/dev/null 2>&1; then
      secret="$(openssl rand -hex 32)"
    else
      secret="$(node -e 'process.stdout.write(require("crypto").randomBytes(32).toString("hex"))')"
    fi
    sed "s|^JWT_SECRET=.*|JWT_SECRET=${secret}|" "$ROOT_DIR/backend/.env.example" > "$ROOT_DIR/backend/.env"
    printf 'Created backend/.env from backend/.env.example with a generated JWT secret\n'
  else
    printf 'Using existing backend/.env\n'
  fi

  if [ ! -f "$ROOT_DIR/frontend/.env" ]; then
    cp "$ROOT_DIR/frontend/.env.example" "$ROOT_DIR/frontend/.env"
    printf 'Created frontend/.env from frontend/.env.example\n'
  else
    printf 'Using existing frontend/.env\n'
  fi
}

ensure_dependencies() {
  log "Checking Node dependencies"

  if [ ! -d "$ROOT_DIR/node_modules" ]; then
    npm install --prefix "$ROOT_DIR"
  else
    printf 'Root dependencies already installed\n'
  fi

  if [ ! -d "$ROOT_DIR/backend/node_modules" ]; then
    npm install --prefix "$ROOT_DIR/backend"
  else
    printf 'Backend dependencies already installed\n'
  fi

  if [ ! -d "$ROOT_DIR/frontend/node_modules" ]; then
    npm install --prefix "$ROOT_DIR/frontend"
  else
    printf 'Frontend dependencies already installed\n'
  fi
}

ensure_mongodb() {
  log "Checking MongoDB on ${MONGO_HOST}:${MONGO_PORT}"

  if mongo_ready; then
    printf 'MongoDB is already reachable\n'
    return
  fi

  if ! command -v docker >/dev/null 2>&1; then
    printf 'MongoDB is not reachable and Docker is not installed or not on PATH.\n' >&2
    printf 'Start MongoDB manually, then rerun: npm run demo\n' >&2
    exit 1
  fi

  if ! docker info >/dev/null 2>&1; then
    printf 'MongoDB is not reachable and Docker is not running.\n' >&2
    printf 'Start Docker Desktop or start MongoDB manually, then rerun: npm run demo\n' >&2
    exit 1
  fi

  if docker ps -a --format '{{.Names}}' | grep -Fxq "$MONGO_CONTAINER_NAME"; then
    printf 'Starting existing Docker container %s\n' "$MONGO_CONTAINER_NAME"
    docker start "$MONGO_CONTAINER_NAME" >/dev/null
  else
    printf 'Creating Docker container %s from %s\n' "$MONGO_CONTAINER_NAME" "$MONGO_IMAGE"
    docker run -d -p "${MONGO_PORT}:27017" --name "$MONGO_CONTAINER_NAME" "$MONGO_IMAGE" >/dev/null
  fi

  printf 'Waiting for MongoDB'
  for _ in $(seq 1 30); do
    if mongo_ready; then
      printf '\nMongoDB is ready\n'
      return
    fi
    printf '.'
    sleep 1
  done

  printf '\nMongoDB did not become ready within 30 seconds.\n' >&2
  exit 1
}

seed_demo_data() {
  if [ "${SKIP_SEED:-0}" = "1" ]; then
    log "Skipping demo seed (SKIP_SEED=1)"
    return
  fi
  log "Seeding demo data"
  printf 'Note: this resets questions to the seed bank and clears ALL quiz scores.\n'
  printf 'Set SKIP_SEED=1 to keep existing data (e.g. after testing admin CRUD).\n'
  npm run seed --prefix "$ROOT_DIR/backend"
}

start_app() {
  log "Starting the app"
  cat <<'EOF'
Frontend:  http://localhost:5173
Backend:   http://localhost:5001
Swagger:   http://localhost:5001/api-docs

Seeded admin account:
  username: admin
  password: AdminPass123

Seeded player accounts:
  username: player1
  password: PlayerPass123
  username: player2
  password: PlayerPass123

Press Ctrl+C to stop the backend and frontend dev servers.
Run "npm run demo:stop" to stop the demo MongoDB container.
EOF

  npm run dev --prefix "$ROOT_DIR"
}

cd "$ROOT_DIR"
ensure_env_files
ensure_dependencies
ensure_mongodb
seed_demo_data
start_app
