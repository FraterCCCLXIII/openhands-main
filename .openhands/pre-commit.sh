#!/usr/bin/env bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

"$ROOT_DIR/.openhands/setup.sh" || exit 1

# Frontend checks
npm run typecheck || exit 1
npm run lint || exit 1
NODE_ENV=test npm test || exit 1

# Backend Python checks
cd "$ROOT_DIR/backend" || exit 1
echo "Running Python lint checks..."
uv run ruff format --check . || exit 1
uv run ruff check . || exit 1
uv run pycodestyle --max-line-length=88 --ignore=E203,E501,W503,E704 app tests || exit 1
uv run pyright || exit 1
echo "Python checks passed."
