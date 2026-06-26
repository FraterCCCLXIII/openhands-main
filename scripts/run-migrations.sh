#!/usr/bin/env bash
# Run Alembic migrations for integrations-hub
#
# This script is intended to be run during deploy (e.g., Vercel build) or
# manually before deploying. It requires INTHUB_POSTGRES_URL to be set.
#
# Usage:
#   ./scripts/run-migrations.sh          # Run migrations
#   ./scripts/run-migrations.sh --check  # Check current migration status
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/../backend"

cd "$BACKEND_DIR"

# Check if database URL is configured first (skip early if not needed)
if [[ -z "${INTHUB_POSTGRES_URL:-}" ]]; then
    echo "ℹ️  No database configured (preview deployment). Skipping migrations."
    exit 0
fi

# Try uv first (faster, preferred for local dev), fall back to pip
if command -v uv &> /dev/null; then
    echo "Installing backend dependencies with uv..."
    uv sync --quiet
    ALEMBIC_CMD="uv run alembic"
else
    echo "Installing migration dependencies with pip..."
    # alembic needs sqlalchemy for connection management, psycopg (v3) for postgres driver
    pip install --quiet 'alembic' 'sqlalchemy' 'psycopg[binary]'
    ALEMBIC_CMD="alembic"
fi

if [[ "${1:-}" == "--check" ]]; then
    echo "Checking migration status..."
    $ALEMBIC_CMD current
    $ALEMBIC_CMD history
else
    echo "Running database migrations..."
    $ALEMBIC_CMD upgrade head
    echo "Migrations complete."
fi
