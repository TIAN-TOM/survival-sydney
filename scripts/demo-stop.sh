#!/usr/bin/env bash
set -euo pipefail

MONGO_CONTAINER_NAME="${MONGO_CONTAINER_NAME:-comp5347-quiz-mongo}"

if ! command -v docker >/dev/null 2>&1; then
  printf 'Docker is not installed or not on PATH.\n' >&2
  exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -Fxq "$MONGO_CONTAINER_NAME"; then
  docker stop "$MONGO_CONTAINER_NAME" >/dev/null
  printf 'Stopped Docker container %s\n' "$MONGO_CONTAINER_NAME"
else
  printf 'No demo MongoDB container named %s was found\n' "$MONGO_CONTAINER_NAME"
fi
