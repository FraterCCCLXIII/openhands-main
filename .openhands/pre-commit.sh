#!/usr/bin/env bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

"$ROOT_DIR/.openhands/setup.sh" || exit 1
npm run typecheck || exit 1
NODE_ENV=test npm test || exit 1
