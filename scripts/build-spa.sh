#!/bin/bash
# Build script for SPA mode static export.
#
# In SPA mode, all /api/* routes are handled by the FastAPI backend, so
# Next.js API routes are not needed. This script temporarily moves the
# API routes out of the way during the static export build.
#
# Usage: npm run build:spa
# Or directly: ./scripts/build-spa.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Paths - backup must be OUTSIDE app/ to avoid Next.js picking it up
API_AUTH_DIR="$PROJECT_ROOT/app/api/auth"
API_AUTH_BACKUP="$PROJECT_ROOT/.spa-build-backup/auth"

echo "Building SPA mode static export..."

# Backup and remove API routes that can't be statically exported
if [ -d "$API_AUTH_DIR" ]; then
    echo "Temporarily moving API auth routes for static export..."
    mkdir -p "$(dirname "$API_AUTH_BACKUP")"
    mv "$API_AUTH_DIR" "$API_AUTH_BACKUP"
fi

# Ensure cleanup on exit (success or failure)
cleanup() {
    if [ -d "$API_AUTH_BACKUP" ]; then
        echo "Restoring API auth routes..."
        mv "$API_AUTH_BACKUP" "$API_AUTH_DIR"
        rmdir "$(dirname "$API_AUTH_BACKUP")" 2>/dev/null || true
    fi
}
trap cleanup EXIT

# Run the Next.js build with SPA mode enabled
export SPA_MODE=true
npx next build

# Verify the build produced the expected output
if [ ! -d "$PROJECT_ROOT/out" ]; then
    echo "Error: SPA build did not produce out/ directory"
    exit 1
fi

echo "SPA build complete. Static files are in out/"
