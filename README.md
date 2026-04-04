# OpenHands Context Layer

A context layer for AI agents built with Next.js, TypeScript, Auth.js, Neon, curated built-in connectors, Composio, and the official MCP SDK.

## What this implements

- A single unified invocation endpoint: `POST /api/context/[integrationKey]/[functionName]`
- Connector onboarding for curated built-in connectors plus custom MCP integrations
- Existing-library adapter layer:
  - `@composio/core` for broader SaaS/API tool execution
  - `@modelcontextprotocol/sdk` for both hosted built-in MCP routes and remote MCP server access
- Fine-grained controls for:
  - integration enable/disable
  - function enable/disable
  - agent-class scoped policy rules
- Dynamic human approval workflow with expiring temporary grants
- Notification fanout to email, in-app, and SMS channels
- Auth.js-based admin login with Google support and a dev login fallback
- A Tailwind admin UI styled after the OpenHands KPI tracker dark dashboard patterns
- Vercel-friendly persistence using Neon / `POSTGRES_URL` or `DATABASE_URL`
- A Vercel cron endpoint to purge expired grants

## Stack

- Next.js App Router
- React 19 + TypeScript
- Tailwind CSS 4
- Auth.js (`next-auth`)
- Neon serverless Postgres driver
- TanStack Query + Zustand for dashboard interactivity
- Vitest for tests

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy envs and configure as needed:

```bash
cp .env.example .env.local
```

3. For local development, you can bypass interactive auth entirely. In this mode the app only responds to localhost requests. When you open the dashboard, it provisions a personal context-layer API key for the current user and stores it server-side:

```bash
DISABLE_AUTH=true npm run dev
```

4. Open the app:

```text
http://localhost:3000
```

## Environment variables

Core variables:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
- `POSTGRES_URL` or `DATABASE_URL`
- `COMPOSIO_API_KEY`
- `CRON_SECRET`

Optional provider OAuth variables for built-in per-user connections:

- `NOTION_CLIENT_ID`
- `NOTION_CLIENT_SECRET`
- `FIGMA_CLIENT_ID`
- `FIGMA_CLIENT_SECRET`

Optional auth variables:

- `NEXTAUTH_URL` for local development only
- `AUTH_TRUST_HOST=true` for Vercel/custom proxy deployments
- `AUTH_REDIRECT_PROXY_URL=https://openhands-context-layer.vercel.app/api/auth` to enable GitHub OAuth on preview deployments

Optional notification variables:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

## GitHub sign-in setup

### Basic deployment

1. Create a GitHub OAuth App in the OpenHands organization:
   - https://github.com/organizations/OpenHands/settings/applications/new
2. Set the app values to:
   - **Homepage URL:** `https://openhands-context-layer.vercel.app`
   - **Authorization callback URL:** `https://openhands-context-layer.vercel.app/api/auth/callback/github`
3. In Vercel or `.env.local`, set:
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `AUTH_SECRET` (or `NEXTAUTH_SECRET`)
   - `AUTH_TRUST_HOST=true`
4. For local development only, set:
   - `NEXTAUTH_URL=http://localhost:3000`
5. Redeploy after updating environment variables.

### Enabling OAuth on preview deployments

This project now follows the same Auth.js preview deployment pattern used by `OpenHands/kpi-tracker`.

1. Deploy the production app first at a stable URL:
   - `https://openhands-context-layer.vercel.app`
2. Keep the GitHub OAuth callback URL fixed to production:
   - `https://openhands-context-layer.vercel.app/api/auth/callback/github`
3. Add `AUTH_REDIRECT_PROXY_URL` to **all** Vercel environments (Production, Preview, and Development):
   - `AUTH_REDIRECT_PROXY_URL=https://openhands-context-layer.vercel.app/api/auth`
4. Keep the same `AUTH_SECRET` value in all environments that need GitHub OAuth.
5. When a user signs in from a preview deployment, Auth.js will proxy the OAuth callback through production and then redirect back to the preview URL.

Notes:
- If you set `DISABLE_AUTH=true`, the app bypasses interactive login, only serves localhost requests, and you can open `/admin` directly for local development.
- The dashboard automatically provisions a personal context-layer API key for the signed-in user (or the local dev user when auth is disabled) and stores it server-side.
- Agents can call `POST /api/context/*` only after a user has opened the dashboard once and provisioned a personal key.
- `GET /api/context/skill` returns a generated `SKILL.md` file that lists the currently available tools for the profile behind that personal key.
- If you want localhost GitHub login without the redirect proxy flow, create a separate GitHub OAuth app with callback `http://localhost:3000/api/auth/callback/github`.

## Built-in provider OAuth setup

For providers that support per-user OAuth in the admin UI, create a provider OAuth app and set the matching client ID and secret in the environment.

### Notion

1. Create a public or internal integration in Notion.
2. Add the redirect URI:
   - `https://<your-host>/api/oauth/notion/callback`
   - `http://localhost:3000/api/oauth/notion/callback` for local development
3. Set `NOTION_CLIENT_ID` and `NOTION_CLIENT_SECRET`.
4. In the dashboard, choose the Notion built-in connector and click **Connect**.

### Figma

1. Create a Figma OAuth app.
2. Add the redirect URI:
   - `https://<your-host>/api/oauth/figma/callback`
   - `http://localhost:3000/api/oauth/figma/callback` for local development
3. Set `FIGMA_CLIENT_ID` and `FIGMA_CLIENT_SECRET`.
4. In the dashboard, choose the Figma built-in connector and click **Connect**.

The callback routes store provider access tokens encrypted in the database as per-user integration connections. Agent calls to `/api/context/*` are authorized with the user's personal context-layer API key, which is then used to resolve and inject the correct per-user provider credentials server-side.



## Key routes

- `GET /api/context/skill`
- `GET/POST /api/integrations`
- `POST /api/integrations/[integrationKey]/functions`
- `POST /api/integrations/[integrationKey]/toggle`
- `POST /api/integrations/[integrationKey]/functions/[functionName]/toggle`
- `PUT /api/agent-classes/[agentClass]`
- `GET/POST /api/access-requests`
- `POST /api/access-requests/[requestId]/approve`
- `POST /api/access-requests/[requestId]/reject`
- `GET /api/notifications`
- `GET /api/cron/expire-grants`

## Verification

```bash
npm run typecheck
npm test
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
