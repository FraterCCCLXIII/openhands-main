# AGENTS.md

## Repository purpose

This repository contains a Next.js/TypeScript implementation of an agent context layer. It exposes a single agent-facing context endpoint, supports DB-backed managed connectors plus Composio-backed and MCP SDK-backed integrations, provides fine-grained agent-class permissions plus temporary approval grants, and ships with a Tailwind admin dashboard styled after the OpenHands KPI tracker.

## Common commands

- Install dependencies: `npm install`
- Run locally with auth bypass: `DISABLE_AUTH=true npm run dev`
- Run tests: `npm test`
- Typecheck: `npm run typecheck`
- Production build check: `npm run build`

## Workflow notes

- For this workstream, push code changes to `origin/openhands/oauth-interface-improvement` when the user asks for code updates to be pushed.

## Architecture notes

- `app/` contains the App Router pages and API route handlers.
- `src/lib/core/service.ts` contains the main permissioning, approval, and invocation orchestration logic.
- `src/lib/adapters/composio-adapter.ts` uses `@composio/core` for Composio-backed tool execution.
- `src/lib/adapters/mcp-adapter.ts` uses `@modelcontextprotocol/sdk` to call remote MCP tools.
- `src/lib/db/postgres-repository.ts` uses Neon with `POSTGRES_URL` or `DATABASE_URL`; `src/lib/db/memory-repository.ts` is the local/test fallback.
- Managed OAuth connectors store user-specific provider tokens server-side as per-user integration connection records instead of embedding them in the integration spec.
- OAuth onboarding uses `/api/oauth/[provider]/start` and `/api/oauth/[provider]/callback`, persists encrypted credentials plus short-lived state records in the repository, and `/api/context/*` resolves the calling user from the personal context-layer API key so the correct per-user OAuth token is injected at invocation time.
- Service OAuth callbacks now follow the same stable-domain preview proxy pattern as Auth.js: when `AUTH_REDIRECT_PROXY_URL` is configured, provider auth flows register and exchange against `<stable-origin>/api/oauth/<provider>/callback`, and the stable callback forwards back to the preview deployment callback URL stored in OAuth state before finishing the token exchange.
- Managed connector registration defaults should prefer official vendor MCP endpoints when available; Notion now uses the official hosted MCP at `https://mcp.notion.com/mcp` instead of a Composio-generated fallback.
- Static built-ins have been removed; the integrations wizard's "Built-in connector" path is now a compatibility label for service-level managed connectors stored in the repository.

- `src/lib/auth.ts` configures Auth.js for GitHub OAuth on the hosted dashboard using the same preview-deployment redirect proxy pattern as `OpenHands/kpi-tracker`; the GitHub provider requests both `read:user` and `user:email` so the dashboard can populate signed-in email addresses more reliably. `DISABLE_AUTH=true` bypasses interactive auth for local development.
- `src/components/admin/admin-dashboard.tsx` is the OpenHands-inspired Tailwind dashboard using TanStack Query + Zustand.
- `src/components/admin/dashboard-workspace.tsx` now contains the main sidebar-driven dashboard UX with a compact, Vercel-inspired density pass across Home, User Profile, Integrations, and Agent Connection; `src/components/admin/admin-dashboard.tsx` is a thin re-export so the admin page import stays stable.
- `src/components/admin/integration-wizard.tsx` powers the guided integration onboarding flow: choose the managed-connector catalog (still labeled "Built-in connector" in the UI) vs a raw MCP server, search the service-level managed connector list, connect OAuth-backed providers or enter manual credentials, discover functions, then review per-function access defaults before saving. Step 2 shows only ready-to-use managed connectors and links users to `/add-connector` when they need something new.
- `src/components/admin/curated-provider-list.tsx` renders the `/add-connector` researched provider catalog as a compact searchable vertical list; entries are collapsed by default, expand inline, and only show the managed-connector registration form to signed-in users whose email is allowlisted in `APP_ADMIN_EMAILS`.

- `app/add-connector/page.tsx` is the user/admin-facing OAuth connector request page: users are told to contact `ADMIN_EMAIL` (or “an admin” if unset), while admins get step-by-step setup guidance for registering managed connectors, the researched OAuth provider catalog, and notes that in-app registration is gated by `APP_ADMIN_EMAILS` from Vercel environment variables.
- `app/api/add-connector/route.ts` stores add-connector form submissions as in-app notifications so the team can review requested providers from the existing dashboard notification feed.
- `src/lib/integrations/oauth-provider-catalog.ts` and `app/api/integrations/oauth-provider-catalog/route.ts` expose the researched OAuth-capable provider catalog used by the add-connector/admin UI.
- `app/api/integrations/discover/route.ts` and `src/lib/integrations/discovery.ts` provide server-side function discovery for managed connectors, Composio toolkits, and remote MCP servers.
- Admin-managed connectors should be treated as service-level OAuth-backed MCP registrations: admins register the MCP server URL plus OAuth metadata once, then each user separately connects their own account in the wizard and discovery uses that stored per-user OAuth connection to call `listTools` on the managed MCP.
- The add-connector provider catalog now pre-fills a provider-specific MCP server URL default for each researched service: known official URLs are used where available (currently GitHub Copilot and Slack), while the rest of the curated catalog uses a researched Composio-hosted MCP template (`https://mcp.composio.dev/partner/composio/<provider>/mcp?customerId=replace-me`) verified against Composio's public MCP generation flow; the UI blocks saving until admins replace the placeholder customerId. The registration form now hides scopes/authorization/token fields when those OAuth defaults are already known in source, keeps only a single OAuth docs link, and auto-populates the callback URL with the current deployment origin in the browser (falling back to `https://<your-deployment>/api/oauth/<provider>/callback` during server render).
- Managed connectors now provide a data-driven escape hatch for common nonstandard integrations: admins can upsert DB-backed connector definitions through `app/api/managed-connectors/route.ts`, but `POST` is restricted to signed-in users allowlisted in `APP_ADMIN_EMAILS`; discovery and the wizard's built-in-compatible catalog are now backed entirely by those managed records, `src/lib/adapters/http-adapter.ts` executes their request templates, and `src/lib/oauth/provider-resolver.ts` turns stored OAuth client metadata into runtime OAuth providers.
- New OAuth managed connectors must be registered with both `oauthClientId` and `oauthClientSecret`; otherwise they should not be considered wizard-ready. The add-connector UI now blocks incomplete registrations, marks successful ones as ready locally, and the integration wizard refetches `/api/integrations/built-in-connectors` on step 2 so freshly registered connectors show up instead of stale cached data.
- Outside tests, the app should not fall back to `MemoryRepository`. If `POSTGRES_URL` / `DATABASE_URL` are missing, signed-in users should see a service-unavailable screen; admins see setup instructions for configuring Postgres, and normal users see a generic unavailable message. Runtime service/repository access now hard-fails in that state.
- `src/lib/db/postgres-repository.ts` bootstraps schema lazily on first use. On Neon/Vercel, concurrent serverless requests can race on `CREATE TABLE IF NOT EXISTS`, so schema initialization now runs inside a single transaction guarded by `pg_advisory_xact_lock(...)`, plus an in-process promise dedupe to avoid duplicate work within one runtime instance.
- MCP discovery should only infer `api_key` auth when a secret is present; a default header name by itself should still resolve to `none`, which matters for local proxy-based QA.
- Local QA can be exercised with `DISABLE_AUTH=true npm run dev` on localhost plus a tiny localhost proxy that forwards `http://127.0.0.1:12001/` to GitHub's hosted MCP using `GITHUB_TOKEN`; the dashboard provisions a per-user context API key server-side, and agents cannot call `/api/context/*` until a user has opened `/admin` once to provision that key.
- `FunctionSpec.accessMode` now supports `enabled`, `disabled`, and `approval_required`; `approval_required` bypasses agent-class policy and requires a temporary grant.
- `app/api/cron/expire-grants/route.ts` is intended for a Vercel cron job to purge expired temporary grants.
- `.github/workflows/` now includes OpenHands PR review (`pr-review-by-openhands.yml`, `pr-review-evaluation.yml`) and vulnerability remediation (`vulnerability-scan.yml`) wrappers copied from `OpenHands/extensions` plugins.
- `app/globals.css` plus `src/components/ui/{button,badge,card}.tsx` now mirror the OpenHands frontend palette more closely: gold primary accents (`#c9b974`/`#cfb755`), flatter dark surfaces, system sans body text, and IBM Plex Mono for code; admin/dashboard styling should stay aligned with those shared primitives.

