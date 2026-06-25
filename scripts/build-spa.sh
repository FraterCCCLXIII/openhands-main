#!/bin/bash
# Build script for SPA mode static export.
#
# In SPA mode, FastAPI handles all /api/* routes and serves the static export.
# Usage: npm run build:spa

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Building SPA mode static export..."

export SPA_MODE=true
npx next build

if [ ! -d "$PROJECT_ROOT/out" ]; then
    echo "Error: SPA build did not produce out/ directory"
    exit 1
fi

echo "SPA build complete. Static files are in out/"
