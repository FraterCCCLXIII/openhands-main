# OpenHands Context Layer

OpenHands Context Layer is a Next.js + TypeScript application that gives agents one authenticated tool surface while keeping connector setup, per-user credentials, approvals, and operational controls in a human-facing dashboard.

Teams use it to connect SaaS tools and custom MCP servers, attach each user's own credentials, decide which tools agents can call, and require case-by-case human approval when needed. It also generates the REST, MCP, and OpenAPI connection details agents need so users can hand over a single controlled interface instead of exposing raw third-party credentials and scattered integration setup.

## Highlights

- Unified agent runtime endpoint: `POST /api/context/[integrationKey]/[toolName]`
- Agent-facing MCP server at `POST /api/mcp`
- Generated agent docs via the downloadable tool catalog at `GET /api/context/skill` and the OpenAPI document at `GET /api/context/openapi`
- Separate user and admin automation APIs with their own OpenAPI documents
- Per-user managed connectors, OAuth connections, and remote MCP integrations
- Function-level access modes: `enabled`, `disabled`, and `approval_required`
- Temporary approval grants plus invocation tracking for auditability
- Dashboard routes organized around top-level pages instead of the old `/admin` entrypoint

## Repository docs

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

- `POST /api/context/[integrationKey]/[toolName]`
- `GET /api/context/skill`
- `GET /api/context/openapi`
- `POST /api/mcp`

### User automation API

- `GET /api/user/openapi`
- `GET /api/user/integrations`
- `PATCH /api/user/integrations/[integrationKey]/tools/[toolName]`
- `GET|POST /api/user/key`

### Admin automation API

- `GET /api/admin/openapi`
- `GET|POST /api/admin/key`
- `GET|POST /api/admin/managed-connectors`
- `POST /api/admin/integrations/discover`

For a fuller route map and auth breakdown, see [API.md](./API.md).

## Stack

- Next.js App Router
- React 19 + TypeScript
- Tailwind CSS 4
- Auth.js
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

3. Configure storage. The app requires `POSTGRES_URL` or `DATABASE_URL` for the dashboard/runtime; without one, signed-in users will see the service-unavailable screen.

4. Start the app:

   ```bash
   # Standard local development
   npm run dev

   # Or bypass interactive auth for localhost-only development
   DISABLE_AUTH=true npm run dev
   ```

5. Open the dashboard:

   ```text
   http://localhost:3000/integrations
   ```

6. Visit `/integrations` once to provision the personal agent/runtime API key, then open `/agent-connection` for the generated REST and MCP connection examples.

## Environment variables

Core variables:

- `POSTGRES_URL` or `DATABASE_URL`
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `CRON_SECRET`

Optional integration/provider variables:

- `COMPOSIO_API_KEY`
- `NOTION_CLIENT_ID`
- `NOTION_CLIENT_SECRET`
- `FIGMA_CLIENT_ID`
- `FIGMA_CLIENT_SECRET`

Optional deployment variables:

- `NEXTAUTH_URL` for localhost sign-in flows
- `AUTH_TRUST_HOST=true` for Vercel/custom proxy deployments
- `AUTH_REDIRECT_PROXY_URL=https://<stable-host>/api/auth` for preview-deployment GitHub OAuth
- `APP_ADMIN_EMAILS` to allowlist admin-integrations and admin automation features

Optional notification variables:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

See [`.env.example`](./.env.example) for the full template.

## GitHub sign-in setup

1. Create a GitHub OAuth App:
   - https://github.com/organizations/OpenHands/settings/applications/new
2. Set the app values to your deployment origin:
   - **Homepage URL:** `https://<your-host>`
   - **Authorization callback URL:** `https://<your-host>/api/auth/callback/github`
3. Set these values in Vercel or `.env.local`:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `AUTH_SECRET`
   - `AUTH_TRUST_HOST=true` for hosted deployments
4. For localhost sign-in, set:
   - `NEXTAUTH_URL=http://localhost:3000`
5. For preview deployments, keep the GitHub callback fixed to a stable deployment and set `AUTH_REDIRECT_PROXY_URL` in every environment.

If you set `DISABLE_AUTH=true`, the app bypasses interactive login, only serves localhost requests, and you should open `/integrations` (not `/admin`) for local development.

## Provider OAuth setup

Managed provider callbacks use the pattern:

- `https://<your-host>/api/oauth/<provider>/callback`
- `http://localhost:3000/api/oauth/<provider>/callback` for local development

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

Generate a test coverage report:

```bash
npm run test:coverage
```

This runs all tests with V8 coverage instrumentation and outputs a summary table showing statement, branch, function, and line coverage for each file.

For an interactive HTML report, run:

```bash
npm run test:coverage -- --coverage.reporter=html
```

Then open `coverage/index.html` in your browser.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
