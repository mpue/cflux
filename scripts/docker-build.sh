#!/bin/bash
# Build script that increments the build number before Docker build
# Usage: ./scripts/docker-build.sh [docker-compose args...]

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Increment build number
node "$SCRIPT_DIR/increment-build.js"

# Run docker-compose build with any passed arguments
cd "$PROJECT_DIR"
docker-compose up --build "$@"
