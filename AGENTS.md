# AGENTS.md

## Repository purpose

This repository contains a Next.js/TypeScript implementation of an agent context layer. It exposes a single agent-facing context endpoint, supports curated Vercel-hosted built-in connectors plus Composio-backed and MCP SDK-backed integrations, provides fine-grained agent-class permissions plus temporary approval grants, and ships with a Tailwind admin dashboard styled after the OpenHands KPI tracker.

## Common commands

- Install dependencies: `npm install`
- Run locally with auth bypass: `DISABLE_AUTH=true npm run dev`
- Run tests: `npm test`
- Typecheck: `npm run typecheck`
- Production build check: `npm run build`

## Architecture notes

- `app/` contains the App Router pages and API route handlers.
- `src/lib/core/service.ts` contains the main permissioning, approval, and invocation orchestration logic.
- `src/lib/adapters/composio-adapter.ts` uses `@composio/core` for Composio-backed tool execution.
- `src/lib/adapters/mcp-adapter.ts` uses `@modelcontextprotocol/sdk` to call remote MCP tools.
- `src/lib/db/postgres-repository.ts` uses Neon with `POSTGRES_URL` or `DATABASE_URL`; `src/lib/db/memory-repository.ts` is the local/test fallback.
- Built-in Notion and Figma connectors now default to `oauth2`; user-specific provider tokens are stored server-side as per-user integration connection records instead of being embedded in the integration spec.
- OAuth onboarding uses `/api/oauth/[provider]/start` and `/api/oauth/[provider]/callback`, persists encrypted credentials plus short-lived state records in the repository, and `/api/context/*` resolves the calling user from the personal context-layer API key so the correct per-user OAuth token is injected at invocation time.

- `src/lib/auth.ts` configures Auth.js for GitHub OAuth on the hosted dashboard using the same preview-deployment redirect proxy pattern as `OpenHands/kpi-tracker`; `DISABLE_AUTH=true` bypasses interactive auth for local development.
- `src/components/admin/admin-dashboard.tsx` is the OpenHands-inspired Tailwind dashboard using TanStack Query + Zustand.
- `src/components/admin/dashboard-workspace.tsx` now contains the main sidebar-driven dashboard UX with a compact, Vercel-inspired density pass across Home, User Profile, Integrations, and Agent Connection; `src/components/admin/admin-dashboard.tsx` is a thin re-export so the admin page import stays stable.
- `src/components/admin/integration-wizard.tsx` powers the guided integration onboarding flow: choose a Built-in connector vs MCP, search the curated Vercel-hosted built-in connector list, connect OAuth-backed providers or enter manual credentials, discover functions, then review per-function access defaults before saving.
- `src/lib/integrations/built-in-connectors.ts` defines the curated built-in catalog for GitHub, Figma, Notion, Slack, and Google Docs.
- `app/api/mcp/*/route.ts` hosts stateless MCP routes that proxy those curated built-ins to provider REST APIs using the caller's bearer token.
- `app/api/integrations/discover/route.ts` and `src/lib/integrations/discovery.ts` provide server-side function discovery for built-in connectors, Composio toolkits, and remote MCP servers.
- MCP discovery should only infer `api_key` auth when a secret is present; a default header name by itself should still resolve to `none`, which matters for local proxy-based QA.
- Local QA can be exercised with `DISABLE_AUTH=true npm run dev` on localhost plus a tiny localhost proxy that forwards `http://127.0.0.1:12001/` to GitHub's hosted MCP using `GITHUB_TOKEN`; the dashboard provisions a per-user context API key server-side, and agents cannot call `/api/context/*` until a user has opened `/admin` once to provision that key.
- `FunctionSpec.accessMode` now supports `enabled`, `disabled`, and `approval_required`; `approval_required` bypasses agent-class policy and requires a temporary grant.
- `app/api/cron/expire-grants/route.ts` is intended for a Vercel cron job to purge expired temporary grants.
- `.github/workflows/` now includes OpenHands PR review (`pr-review-by-openhands.yml`, `pr-review-evaluation.yml`) and vulnerability remediation (`vulnerability-scan.yml`) wrappers copied from `OpenHands/extensions` plugins.
