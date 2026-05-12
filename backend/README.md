# Python FastAPI backend

This directory contains the Python/FastAPI backend stack for the integrations hub. It replaces the previous Next.js `app/api` backend surface while keeping route names and payloads close to 1-to-1 for the dashboard/frontend in the root Next.js app.

## Local development

```bash
cd backend
python -m venv .venv
. .venv/bin/activate
pip install -r requirements-dev.txt
DISABLE_AUTH=true uvicorn backend.app.main:app --reload --app-dir ..
```

The FastAPI app owns the `/api/...` backend paths that were previously implemented as Next.js route handlers. For local parity testing, set `DISABLE_AUTH=true` or send `X-Owner-Id: <email>` headers.

## Vercel deployment

For the combined preview app, the root `vercel.json` rewrites `/api/:path*` to the root Python entrypoint `api/index.py`, which exports the FastAPI `app` and keeps dashboard button actions on the same origin. You can also deploy `backend/` as a separate Vercel project/root directory; `backend/vercel.json` routes all requests to its own `api/index.py` and preserves the existing `/api/cron/expire-grants` schedule.

Required/optional environment variables are intentionally aligned with the root application where possible:

- `APP_ADMIN_EMAILS` — comma-separated allowlist for admin-only routes.
- `DISABLE_AUTH=true` — local/preview auth bypass for contract testing.
- `FASTAPI_DEFAULT_OWNER` — owner identity used when auth is disabled.

The first FastAPI stack uses an in-process repository to make route behavior testable and deployable. Persistent Postgres-backed storage can be added behind `backend/app/repository.py` without changing route contracts.
