# Agent Context Layer

A Vercel-native context layer for AI agents built with Next.js, TypeScript, Auth.js, Neon, Composio, and the official MCP SDK.

## What this implements

- A single unified invocation endpoint: `POST /api/context/[integrationKey]/[functionName]`
- Connector onboarding for API and MCP integrations
- Existing-library adapter layer:
  - `@composio/core` for SaaS/API tool execution
  - `@modelcontextprotocol/sdk` for MCP server access
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

3. For local development, you can bypass interactive auth entirely:

```bash
DISABLE_AUTH=true npm run dev
```

4. Open the app:

```text
http://localhost:3000
```

## Environment variables

Core variables:

- `NEXTAUTH_SECRET` or `AUTH_SECRET`
- `NEXTAUTH_URL` or `AUTH_URL`
- `AUTH_GITHUB_ID` (preferred) or `GITHUB_CLIENT_ID`
- `AUTH_GITHUB_SECRET` (preferred) or `GITHUB_CLIENT_SECRET`
- `POSTGRES_URL` or `DATABASE_URL`
- `COMPOSIO_API_KEY`
- `CRON_SECRET`

Optional notification variables:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_NUMBER`

## GitHub sign-in setup

1. In GitHub, open **Settings → Developer settings → OAuth Apps** (or the matching organization-owned OAuth app flow).
2. Create a new **OAuth App**.
3. Set the **Homepage URL** to your app URL, for example:
   - `http://localhost:3000`
   - `https://openhands-context-layer.vercel.app`
4. Set the **Authorization callback URL** for each environment:
   - `http://localhost:3000/api/auth/callback/github`
   - `https://openhands-context-layer.vercel.app/api/auth/callback/github`
5. In Vercel or `.env.local`, set:
   - `AUTH_GITHUB_ID` (or `GITHUB_CLIENT_ID`)
   - `AUTH_GITHUB_SECRET` (or `GITHUB_CLIENT_SECRET`)
   - `NEXTAUTH_SECRET` (or `AUTH_SECRET`)
   - `NEXTAUTH_URL=https://openhands-context-layer.vercel.app`
6. Redeploy after updating environment variables.

Notes:
- GitHub OAuth apps use one callback URL per app. If you need both localhost and production sign-in, create separate OAuth apps or switch the callback URL when testing.
- If you set `DISABLE_AUTH=true`, the app bypasses interactive login and you can open `/admin` directly for local development.


## Key routes

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
