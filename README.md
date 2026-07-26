# OpenHands Integrations Hub

OpenHands Integrations Hub is a Next.js + TypeScript application that gives agents one authenticated tool surface while keeping connector setup, per-user credentials, approvals, and operational controls in a human-facing dashboard.

Teams use it to connect SaaS tools and custom MCP servers, attach each user's own credentials, decide which tools agents can call, and require case-by-case human approval when needed. It also generates the REST, MCP, and OpenAPI connection details agents need so users can hand over a single controlled interface instead of exposing raw third-party credentials and scattered integration setup.

## Highlights

- Unified agent runtime endpoint: `POST /api/agent/[integrationKey]/[toolName]`
- Agent-facing MCP server at `POST /api/mcp`
- Generated agent docs via the downloadable tool catalog at `GET /api/agent/skill` and the OpenAPI document at `GET /api/agent/openapi`
- Separate user and admin automation APIs with their own OpenAPI documents
- Per-user managed connectors, OAuth connections, and remote MCP integrations
- Function-level access modes: `enabled`, `disabled`, and `approval_required`
- Temporary approval grants plus invocation tracking for auditability
- Dashboard routes organized around top-level pages instead of the old `/admin` entrypoint

## Repository docs

- [ARCHITECTURE.md](./ARCHITECTURE.md) — contributor reference for the security model, testing strategy, and domain glossary
- [API.md](./API.md) — route map for the dashboard and REST/MCP surfaces
- [CONTRIBUTING.md](./CONTRIBUTING.md) — local setup and contribution workflow
- [CHANGELOG.md](./CHANGELOG.md) — notable unreleased and released changes
- [AGENTS.md](./AGENTS.md) — repository memory for OpenHands agents and maintainers
- [.openhands/setup.sh](./.openhands/setup.sh) — session bootstrap for OpenHands/local automation work
- [.openhands/pre-commit.sh](./.openhands/pre-commit.sh) — fast typecheck/test gate before agent commits
- [.openhands/skills/adding-integrations/SKILL.md](./.openhands/skills/adding-integrations/SKILL.md) — repository-specific guide for adding new integrations
- [LICENSE](./LICENSE) — project license

## Dashboard routes

These are the canonical top-level routes in the current app:

- `/` — landing page
- `/integrations` — install integrations, connect OAuth accounts, and manage function access
- `/agent-connection` — view agent/user/admin keys plus REST and MCP connection examples
- `/profile` — signed-in user profile details
- `/case-by-case-approvals` — review pending approval-required tool requests
- `/admin-integrations` — admin-only service-level managed connector and provider catalog management

Legacy compatibility routes still exist, but new docs and links should target the canonical routes above:

- `/home` redirects to `/integrations`

## Core interfaces

### Agent runtime

- `POST /api/agent/[integrationKey]/[toolName]`
- `GET /api/agent/skill`
- `GET /api/agent/openapi`
- `POST /api/mcp`

### User automation API

- `GET /api/user/openapi`
- `GET /api/user/integrations`
- `PATCH /api/user/integrations/[integrationKey]/tools/[toolName]`
- `GET|POST /api/user/key`
- `GET|POST /api/user/agent-key`

### Admin automation API

- `GET /api/admin/openapi`
- `GET|POST /api/admin/key`
- `GET /api/admin/connections`
- `GET /api/admin/overview`
- `GET|POST /api/admin/managed-connectors`
- `POST /api/admin/integrations/discover`

For a fuller route map and auth breakdown, see [API.md](./API.md).

## Stack

- Next.js App Router
- React 19 + TypeScript
- Tailwind CSS 4
- OpenHands same-origin cookie authentication
- Neon serverless Postgres driver
- TanStack Query + Zustand
- Vitest + PGlite-backed repository tests

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the local environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Configure storage. The app requires `INTHUB_POSTGRES_URL` for the backend runtime; without it, signed-in users will see the service-unavailable screen.

   <details>
   <summary>Option A: Local Docker Postgres (recommended for local dev)</summary>

   Start a local Postgres container:

   ```bash
   docker run -d --name integrations-hub-postgres \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=integrationshub \
     -p 5432:5432 \
     postgres:17
   ```

   Then set the connection in `.env.local`:

   ```bash
   INTHUB_POSTGRES_URL="postgresql://postgres:postgres@localhost:5432/integrationshub"
   ```

   </details>

   <details>
   <summary>Option B: Use Neon's free tier</summary>

   For cloud-hosted Postgres:

   1. Create a free account at [neon.tech](https://neon.tech)
   2. Create a new project and database
   3. Copy the connection string from the Neon dashboard and add it to `.env.local`:

   ```bash
   INTHUB_POSTGRES_URL="postgresql://user:password@ep-example-123456.us-east-2.aws.neon.tech/integrationshub?sslmode=require"
   ```

   </details>

4. Run database migrations:

   ```bash
   npm run db:migrate
   ```

5. Start the app:

   ```bash
   npm run dev
   ```

6. Open the dashboard:

   ```text
   http://localhost:3000/integrations
   ```

7. Visit `/integrations` once to provision the personal agent/runtime API key, then open `/agent-connection` for the generated REST and MCP connection examples.

## Integration catalog

The backend reads the `openhands-extensions` Python package (pinned in
`backend/pyproject.toml`) directly at runtime, and the frontend reads
`@openhands/extensions/integrations`. Both consume the same single source of
truth — no generated snapshot is needed.

## Environment variables

Core variables:

- `INTHUB_POSTGRES_URL` — database connection URL for the backend runtime
- `INTHUB_OPENHANDS_BASE_URL` for OpenHands Cloud cookie validation
- `INTHUB_POSTHOG_CLIENT_KEY` to enable explicit, privacy-safe product analytics events (analytics is disabled when unset)
- `INTHUB_CREDENTIAL_ENCRYPTION_KEY` for stored third-party provider credentials
- `INTHUB_CRON_SECRET`
- `INTHUB_MAX_CONCURRENT_BLOCKING_REQUESTS` (default `10`) to cap legacy synchronous backend work without blocking liveness probes
- `INTHUB_READINESS_TIMEOUT_SECONDS` (default `5`) to bound database readiness checks

See [PostHog analytics](docs/posthog-analytics.md) for the event catalog and
privacy constraints.

Optional integration/provider variables:

- `COMPOSIO_API_KEY`
- `NOTION_CLIENT_ID`
- `NOTION_CLIENT_SECRET`
- `FIGMA_CLIENT_ID`
- `FIGMA_CLIENT_SECRET`

Optional deployment variables:

- `INTHUB_OAUTH_REDIRECT_PROXY_URL=https://<stable-host>` for preview-deployment provider OAuth callbacks
- `INTHUB_OAUTH_REDIRECT_PROXY_ALLOWED_TARGET_HOST_REGEX=<regex>` on the stable deployment to allow callbacks only to trusted preview-host names
- `INTHUB_APP_ADMIN_EMAILS` to allowlist admin-integrations, admin automation features, and FastAPI admin routes. The dashboard infers admin status from the backend `/api/context/me` response, not from a client-side env var.

Optional notification variables:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

See [`.env.example`](./.env.example) for the full template.

## OpenHands Cloud sign-in setup

Set `INTHUB_OPENHANDS_BASE_URL` to the OpenHands Cloud deployment users authenticate against. The dashboard inherits the main app browser session cookie and sends same-origin requests to FastAPI. FastAPI validates dashboard sessions with `GET <INTHUB_OPENHANDS_BASE_URL>/api/v1/users/me`.

For local development, sign in through the configured OpenHands Cloud base URL and open `/integrations`.

## Provider OAuth setup

Managed provider callbacks use the pattern:

- `https://<your-host>/api/oauth/<provider>/callback`
- `http://localhost:3000/api/oauth/<provider>/callback` for local development

The Kubernetes image is built for same-origin mounting beneath
`/integrations-hub`, with APIs and OAuth callbacks beneath
`/api/integrations-hub`. Configure `INTHUB_ROOT_PATH` and
`INTHUB_API_ROOT_PATH` to match the image and ingress paths.

Examples:

- Notion: set `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET`
- Figma: set `FIGMA_CLIENT_ID` and `FIGMA_CLIENT_SECRET`

OAuth access tokens are stored as encrypted per-user integration connections and resolved server-side during runtime tool invocation.

## Verification

```bash
npm test
npm run test:e2e
npm run typecheck
npm run build
```

## Test coverage

Generate the full coverage report:

```bash
npm run test:coverage
```

Vitest is configured to emit text, HTML, LCOV, `coverage-summary.json`, and `coverage-final.json` outputs for the main frontend and backend codepaths under `app/`, `src/components/`, and `src/lib/`. Coverage runs include branch coverage, even for files that were not imported during the test run.

For an interactive HTML report, open `coverage/index.html` in your browser after the run finishes.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
