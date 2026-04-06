#!/usr/bin/env bash

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR" || exit 1

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  npm ci || exit 1
fi

created_env_local=0
if [ ! -f .env.local ] && [ -f .env.example ]; then
  cp .env.example .env.local || exit 1
  created_env_local=1
fi

if [ "$created_env_local" -eq 1 ] && ! grep -Eq '^DISABLE_AUTH=' .env.local; then
  printf '\nDISABLE_AUTH=true\n' >> .env.local
fi

export DISABLE_AUTH="${DISABLE_AUTH:-true}"
