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

The FastAPI app owns the `/api/...` backend paths that were previously implemented as Next.js route handlers. For local parity testing, use authenticated local development with an OpenHands Cloud bearer token.

## Running tests

```bash
cd backend
uv run pytest tests/ -v
```

## Container deployment

The root `containers/Dockerfile` builds the dashboard as a static SPA, installs
the Python dependencies from `pyproject.toml` and `uv.lock`, and runs FastAPI
through `backend.app.server`. FastAPI serves both the static dashboard and API
routes from the resulting image.

Required/optional environment variables use explicit `INTHUB_*` names. The backend reads only `INTHUB_*` names and never falls back to the root Next.js environment variable names.

- `INTHUB_POSTGRES_URL` — database connection URL for backend persistence.
- `INTHUB_OPENHANDS_BASE_URL` — OpenHands Cloud base URL used to validate dashboard session tokens.
- `INTHUB_CRON_SECRET` — bearer secret for cron routes.
- `INTHUB_APP_ADMIN_EMAILS` — comma-separated allowlist for admin-only backend routes.
- `INTHUB_CREDENTIAL_ENCRYPTION_KEY` — encryption key for stored provider credentials.
- `INTHUB_MAX_CONCURRENT_BLOCKING_REQUESTS` — bounded worker limit (default `10`) for legacy synchronous connector, database, and auth work.
- `INTHUB_READINESS_TIMEOUT_SECONDS` — deadline (default `5`) for the database readiness check.
- Authenticated local development uses `INTHUB_OPENHANDS_BASE_URL` and OpenHands Cloud bearer tokens; no runtime auth bypass is available.
