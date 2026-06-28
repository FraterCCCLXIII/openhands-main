# Python FastAPI backend

This directory contains the Python/FastAPI backend stack for the integrations hub. It replaces the previous Next.js `app/api` backend surface while keeping route names and payloads close to 1-to-1 for the dashboard/frontend in the root Next.js app.

## Local development

This project uses [uv](https://docs.astral.sh/uv/) for dependency management. Dependencies are defined in `pyproject.toml` and locked in `uv.lock`.

```bash
cd backend
uv sync --dev
uv run uvicorn backend.app.main:app --reload --app-dir ..
```

Or if you prefer a traditional venv workflow:

```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"
uvicorn backend.app.main:app --reload --app-dir ..
```

The FastAPI app owns the `/api/...` backend paths that were previously implemented as Next.js route handlers. For local parity testing, set authenticated local development or send `X-Owner-Id: <email>` headers.

## Running tests

```bash
cd backend
uv run pytest tests/ -v
```

## Vercel deployment

Vercel natively supports uv and will automatically use it to install dependencies from `pyproject.toml` and `uv.lock`. Builds are 30-65% faster compared to pip-based installs.

## Vercel deployment

For the combined preview app, the root `vercel.json` rewrites `/api/:path*` to the root Python entrypoint `api/index.py`, which exports the FastAPI `app` and keeps dashboard button actions on the same origin. You can also deploy `backend/` as a separate Vercel project/root directory; `backend/vercel.json` routes all requests to its own `api/index.py` and preserves the existing `/api/cron/expire-grants` schedule.

Required/optional environment variables use explicit `INTHUB_*` names. The backend reads only `INTHUB_*` names and never falls back to the root Next.js environment variable names.

- `INTHUB_POSTGRES_URL` — database connection URL for backend persistence.
- `INTHUB_OPENHANDS_BASE_URL` — OpenHands Cloud base URL used to validate dashboard session tokens.
- `INTHUB_CRON_SECRET` — bearer secret for cron routes.
- `INTHUB_APP_ADMIN_EMAILS` — comma-separated allowlist for admin-only backend routes.
- `INTHUB_CREDENTIAL_ENCRYPTION_KEY` — encryption key for stored provider credentials.
- Authenticated local development uses `INTHUB_OPENHANDS_BASE_URL` and OpenHands Cloud bearer tokens; no runtime auth bypass is available.

The first FastAPI stack uses an in-process repository to make route behavior testable and deployable. Persistent Postgres-backed storage can be added behind `backend/app/repository.py` without changing route contracts.
