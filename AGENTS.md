# AGENTS.md

## Repository purpose

This repository contains a Next.js/TypeScript implementation of an agent integrations hub. It exposes a single agent-facing runtime endpoint (`/api/agent/*`), supports DB-backed managed connectors plus MCP SDK-backed integrations, provides fine-grained agent-class permissions plus temporary approval grants, and ships with a Tailwind dashboard styled after OpenHands.

The root `LICENSE` is proprietary: `Copyright All Hands AI, Inc. All rights reserved.`

## SPA Architecture

- The dashboard has been refactored to support running as a Single Page Application (SPA) that queries REST endpoints client-side.
- All dashboard pages (`/integrations`, `/profile`, `/agent-connection`, `/case-by-case-approvals`, `/admin-integrations`, `/admin-overview`) now export client components that fetch data via TanStack Query.
- For static site generation, set `SPA_MODE=true` in the build environment; this enables `output: "export"` in `next.config.ts` with trailing slashes and unoptimized images.
- Client-side auth state is managed via `useAuth()` from `src/components/auth/auth-context.tsx`, backed by OpenHands Cloud OAuth device flow and a stored OpenHands bearer token.
- `Providers` only supplies React Query and `AuthProvider`; there is no legacy auth provider layer.

## Deployment Architecture (Vercel + K8s)

The repository supports deployment to both Vercel and self-hosted K8s environments:

### Vercel Deployment (Standard Next.js)
- Uses standard Next.js build (`npm run build`) with SSR capabilities
- Vercel handles page routing and static file serving via CDN
- All `/api/*` routes, including `/api/auth/config` and `/api/auth/session`, rewrite to the FastAPI backend at `api/index.py`
- The dashboard uses OpenHands Cloud OAuth device flow; do not reintroduce legacy dashboard auth providers or Next.js auth routes

### K8s/Docker Deployment (SPA Mode)
- `npm run build:spa` builds a static export to `out/` for K8s deployments
- Set `STATIC_DIR` (or `INTHUB_STATIC_DIR`) to the path containing the pre-built `out/` directory
- FastAPI serves both the SPA static files and all API routes from a single container
- `backend/app/static_files.py` implements static file serving with appropriate caching headers:
  - `/_next/static/*` files are content-hashed, cached aggressively (1 year)
  - HTML files use `must-revalidate` for fresh content
  - SPA catch-all route returns `index.html` for client-side routing

### Build Commands
- `npm run build` - Standard Next.js build (for Vercel)
- `npm run build:spa` - Static export for K8s deployments (outputs to `out/`)

### Environment Variables for K8s
- `STATIC_DIR=/app/out` - Path to pre-built SPA files (enables FastAPI static serving)
- Leave `STATIC_DIR` unset on Vercel (uses standard Next.js integration)

## Common commands

- Bootstrap an OpenHands session: `.openhands/setup.sh`
- Run the pre-commit validation gate: `.openhands/pre-commit.sh`
- Install dependencies: `npm install`
- Run locally with authenticated dashboard flow: `npm run dev`
- Build for static export (SPA mode): `npm run build:spa` (outputs to `out/`)
- Run database migrations: `npm run db:migrate` (or `./scripts/run-migrations.sh`)
- Check migration status: `npm run db:migrate:check`
- Create a new migration: `cd backend && uv run alembic revision -m "description"`
- Run tests: `npm test`
- Run unit tests only: `npm run test:unit`
- Targeted integration-wizard coverage check: `npx vitest run src/components/integrations/wizard/utils.test.ts src/components/integrations/wizard/use-wizard-state.test.tsx src/components/integrations/wizard/review-step.test.tsx src/components/integrations/wizard/connect-step.test.tsx src/components/integrations/wizard/wizard.test.tsx --coverage.enabled --coverage.include='src/components/integrations/wizard/**/*.{ts,tsx}'`
- `npm run audit` currently relies on package overrides for patched transitive dependencies: keep `hono` and `@hono/node-server` aligned with the latest safe releases when `@modelcontextprotocol/sdk` advisories appear, and keep the `postcss` override at `^8.5.10` or newer until Next.js stops pinning the vulnerable `8.4.31` release in CI.

- TypeScript strictness now also enables `noUncheckedIndexedAccess`; when reading dynamic config/credential records or keyed collections, prefer shared narrowing helpers (for example `src/lib/type-utils.ts`) and explicit undefined handling over inline `as string` assertions.
- For targeted HTTP adapter coverage work, run `cd backend && uv run pytest tests/test_backend_smoke.py -k http -q`; the suite covers auth-mode differences, templated query/header/body shaping, multipart/form/text encoding, validation errors, and response parsing fallbacks.

- Shared dashboard fetch-mock builder lives at `src/test-utils/fetch-mock-helpers.ts`; prefer `createDashboardFetchMock({ integrations, managedConnectors, accessRequests, notifications, routeHandler })` over hand-rolled `vi.fn` route routers. Standard routes (`/api/integrations`, `/api/integrations/managed-connectors`, `/api/case-by-case-approvals`, `/api/notifications`) fall back to empty arrays; the `routeHandler` escape hatch handles per-test endpoints (PATCH/DELETE/POST or extra routes like `/api/oauth/connections`) before the standard fallbacks run, and unmatched routes still throw `"Unexpected fetch"` so tests can't silently drift.

- Run e2e tests only: `npm run test:e2e`
- Run targeted mutation testing for a new file: `npm run test:mutation -- src/path/to/new-file.ts`
- Run exploratory full-repo mutation testing: `npm run test:mutation:all`
- Typecheck: `npm run typecheck`
- Production build check: `npm run build`
- Audit shipped dependency graph: `npm run audit`
- Coverage workflow: `npm run test:coverage` emits text/html/lcov/json reports for `app/`, `src/components/`, and `src/lib/`.

- Lint: `npm run lint`

### Python lint checks (backend)

- Python lint and formatting: `npm run lint:python` (runs ruff format check, ruff lint, and pycodestyle)
- Auto-fix Python formatting/lint: `npm run lint:python:fix` (runs ruff format and ruff check --fix)
- Python type checking: `npm run typecheck:python` (runs pyright with basic mode)
- Run Python tests: `npm run test:backend:python`

The backend Python checks are configured in `backend/pyproject.toml`:
- **Ruff**: formatting (double quotes, 4-space indent) and linting (pycodestyle errors, pyflakes, isort, pyupgrade, unused arguments, mutable defaults)
- **Pycodestyle**: additional PEP8 style checks with `--max-line-length=88 --ignore=E203,E501,W503,E704`
- **Pyright**: type checking in basic mode with gradual adoption (type errors are reported as warnings during initial rollout)

The `.openhands/pre-commit.sh` script runs these Python checks alongside the TypeScript/frontend checks.

## Local DB-backed validation

- All automated tests use the Python backend test suite (`backend/tests/`) via `uv run pytest`; the FastAPI backend owns the DB layer through `backend/app/repository.py` (PostgresRepository). Frontend component tests use vitest with jsdom and mock `fetch` via `src/test-utils/fetch-mock-helpers.ts`.
- For direct MCP server unit coverage, mocking `@modelcontextprotocol/sdk/server/mcp.js` and asserting against captured `registerTool(...)` handlers is an effective way to exercise session-default, approval, and result-formatting branches without spinning up a transport client.
- Full repo validation that already exercises the real SQL schema through PGlite: `npm run test:unit && npm run test:e2e && npm run typecheck && npm run build`.
- For live localhost HTTP validation without a real Postgres instance, use a temporary local-only PGlite-backed Neon shim under `.agent_tmp/`, point the installed `@neondatabase/serverless` package at that shim locally (never commit `node_modules`), seed the runtime DB with `PostgresRepository`, then run `INTHUB_POSTGRES_URL='pglite://<name>' npm run dev -- --hostname 127.0.0.1 --port 12000`.
- Proven live validation pattern for `/api/agent/skill`: seed `saveAgentApiKey(...)` plus `upsertOwnerIntegration(...)` for `dev@localhost`, start the app with the same `INTHUB_POSTGRES_URL`, then `curl -i http://127.0.0.1:12000/api/agent/skill -H 'Authorization: Bearer <api-key>'` and expect `200 OK` plus `Content-Disposition: attachment; filename="SKILL.md"`.
- OAuth branch-coverage work is concentrated in `backend/tests/test_backend_smoke.py` (OAuth callback, token exchange, connector registration) and `backend/tests/test_endpoint_coverage.py`; for quick verification of OAuth provider/client-flow regressions, run `cd backend && uv run pytest tests/test_backend_smoke.py -k oauth -q`.

- When authenticated local development, localhost requests are allowed but non-loopback hosts are rejected; open `/integrations` locally if you need the app to provision a fresh personal API key instead of seeding one directly. `/home` is now a legacy redirect.


## Workflow notes

- Next.js 16 removed the old `next lint` entrypoint in this repo's setup; keep `npm run lint` wired to `eslint .` with the root `eslint.config.mjs`. ESLint 10 works here with an explicit flat-config stack (`typescript-eslint` + `@next/eslint-plugin-next`) instead of `eslint-config-next`, which still pulled React lint internals that crashed under ESLint 10 in this repo.
- `npm run audit` is part of the `e2e-tests.yml` CI gate and it scans transitive dev tooling; keep a direct patched `vite` devDependency pinned so advisories in the Vitest/Vite toolchain do not fail PRs.
- Mutation testing now uses a reusable Stryker base config (`stryker.config.mjs`) plus `scripts/run-mutation.mjs`. Run `npm run test:mutation -- <new-source-file>` as a manual review step for newly added code; it infers sibling Vitest files by default, supports explicit `--testFile`, and writes `reports/mutation/mutation.html`. Use `npm run test:mutation:all` only for broad exploratory runs because it can take much longer and soft-fails the break threshold.
- Current mutation pilot baselines after the post-merge test hardening pass: `src/components/admin/integrations/catalog.tsx` improved from 56.14% to 78.43%, and `src/components/integrations/wizard/connect-step.tsx` improved from 23.00% to 58.00%. The main remaining survivors are UI-copy-only branches plus ready-list/reset callbacks, so future hardening should prioritize behavioral assertions around rendered fallback text and connector state transitions.

- The live GitHub repository is `OpenHands/integrations-hub`; some local clones/worktrees may still have a stale `all-hands-ai/integrations-hub` origin URL, so fix the remote before pushing or creating PRs if GitHub reports `Repository not found`.

- For this workstream, when the user requests code changes, commit them and push them to the active PR branch.

## Architecture notes

- `app/` contains the App Router pages and API route handlers.
- `backend/app/main.py` contains the main permissioning, approval, and invocation orchestration logic (FastAPI handler dispatcher + all route handlers).
- Shared backend helpers live in `backend/app/oauth_flow.py`, `backend/app/openapi_tools.py`, `backend/app/managed_connectors.py`, `backend/app/auth.py`, and `backend/app/config.py`; prefer extending those modules before adding more local helper logic back into `main.py`.
- `backend/app/repository.py` (`PostgresRepository`) owns all DB query methods; row mapping helpers are co-located in the same file.
- Follow-up API surface cleanup removed several defensive `| null` input unions where production callers already guarantee strings: stored API-key lookup helpers (`getStoredAgentApiKey`, `getStoredUserApiKey`, `getStoredAdminApiKey`), `getAdminSectionFromPath`, `isLoopbackHost`, and the connector-request `normalizeOptional` helper.

- MCP tool invocation is handled in `backend/app/main.py` via `@modelcontextprotocol/sdk` (see `invoke_mcp_tool`, `discover_mcp_tools`, `mcp_call`).
- The dashboard is a pure SPA that proxies all data through the FastAPI backend; the backend reads `INTHUB_POSTGRES_URL` for its Postgres connection.
- Database schema is managed by Alembic migrations in `backend/alembic/`. Run `npm run db:migrate` or `./scripts/run-migrations.sh` before starting the app or deploying. The initial migration (`backend/alembic/versions/20250512_0001_initial_schema.py`) contains all table definitions.
- OpenAPI builders are in `backend/app/main.py` (`agent_openapi`, `user_openapi`, `admin_openapi`, `managed_openapi`).

- Managed OAuth connectors store user-specific provider tokens server-side as per-user integration connection records instead of embedding them in the integration spec.
- Integrations are installed strictly per user via `owner_integrations`; OAuth access tokens must live only in per-user integration connection records, and owner-scoped `oauth2` installs must not embed credentials in `IntegrationSpec.credentials`.

- OAuth onboarding uses `/api/oauth/[provider]/start` and `/api/oauth/[provider]/callback`, persists encrypted credentials plus short-lived state records in the repository, and `/api/agent/*` resolves the calling user from the restricted agent/runtime integrations-hub API key so the correct per-user OAuth token is injected at invocation time.
- `/api/mcp` now exposes the same per-user integrations hub as an MCP Streamable HTTP server authenticated by the restricted agent/runtime integrations-hub API key. Tool names are namespaced as `<integration>__<function>`, enabled plus `approval_required` functions are listed, MCP URL query params for `agentId` / `agentClass` are optional initial defaults, and callers can also set session-scoped defaults with the managed `set_agent_id` / `set_agent_class` tools or override per call with `agentId` / `agentClass` plus optional `scopes`.
- Case-by-case MCP approvals now support session-scoped agent metadata via `set_agent_data` (currently `conversationLink`). Approval-required MCP tools should refuse to create a pending request until that conversation link is set, so the approvals page can link humans back to the originating conversation.
- User automation keys are now separate hashed-at-rest `clu_...` keys managed through the signed-in dashboard/API (`/api/user/key`) and authenticated against dedicated `/api/user/*` routes. Keep least privilege explicit: `cla_...` agent keys remain for runtime tool invocation only, `/api/user/integrations*` stays scoped to the authenticated owner, and `/api/user/access-requests*` lets that owner review only their own agents' case-by-case requests.
- MCP sessions must survive serverless request fan-out on Vercel. `/api/mcp` now persists session records (owner + session agent defaults) outside process memory and rebuilds a fresh `WebStandardStreamableHTTPServerTransport` per request instead of caching live transport objects in-memory.
- Agent-facing usage guidance is generated from `src/shared/agent-connection.ts`. Keep REST/MCP examples aligned with runtime behavior: `agentId` / `agentClass` are optional and default to `null` when omitted, while MCP tool schemas should expose real top-level connector arguments (for example `body` or path params) instead of only the agent identity override fields.
- Client-safe cross-layer helpers should live in `src/shared/`. `npm run lint` runs ESLint on the frontend.
- The Python/FastAPI backend lives in `backend/`, owns the `/api/...` route surface, and is configured for a separate Vercel project rooted at `backend/`. Keep `backend/app/route_manifest.py` and `backend/tests/test_route_parity.py` aligned when adding/removing backend API routes.
- Root docs now include `README.md`, `ARCHITECTURE.md`, `API.md`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `LICENSE`; `ARCHITECTURE.md` is the canonical contributor reference for the security model, testing strategy, and glossary. Keep README/API route references aligned with the canonical dashboard pages (`/integrations`, `/agent-connection`, `/profile`, `/case-by-case-approvals`, `/admin-overview`, `/admin-integrations`) and generated OpenAPI endpoints.
- `/api/mcp` now pre-validates obvious Streamable HTTP protocol mismatches before handing requests to the MCP SDK transport: session GETs must accept `text/event-stream`, POSTs must advertise both `application/json` and `text/event-stream` plus JSON bodies, and any request with `mcp-session-id` must include `mcp-protocol-version`. This helps turn bad-client/Vercel timeout scenarios into fast 4xx responses with clearer diagnostics.
- Service OAuth callbacks can use the stable-domain preview proxy pattern: when `INTHUB_OAUTH_REDIRECT_PROXY_URL` is configured, provider auth flows register and exchange against `<stable-origin>/api/oauth/<provider>/callback`, and the stable callback forwards back to the preview deployment callback URL stored in OAuth state before finishing the token exchange.
- Managed connector registration defaults should prefer the most reliable official surface for each provider: remote MCP when that is stable, otherwise a managed HTTP connector generated from an official OpenAPI schema. Notion now follows the latter path via `https://developers.notion.com/openapi.json` instead of the hosted Notion MCP.
- Webflow remains a managed oauth-ready connector backed by the official hosted MCP server at `https://mcp.webflow.com/mcp`, but the hosted MCP endpoint expects tokens from its own OAuth server (`https://mcp.webflow.com/oauth/*`), not Webflow Data API app tokens. The admin registration flow now creates a deployment-scoped public PKCE client automatically via `https://mcp.webflow.com/oauth/register`, then each user authorizes their own sites/workspaces through that MCP OAuth flow.
- Datadog is an oauth-ready managed connector backed by the official hosted MCP server. The default US1 endpoint is `https://mcp.datadoghq.com/api/unstable/mcp-server/mcp`; admins can edit the server URL for other Datadog regional sites after registration if needed.

- The old static connector concept has been removed; the integrations wizard now refers to service-level connector registrations simply as managed connectors.

- Shared case-insensitive text normalization and UI/backend search matching now live in `src/lib/text-utils.ts`; prefer reusing `normalizeCaseInsensitiveText`, `matchesSearchQuery`, and `matchesExactSearchQuery` instead of open-coding new `trim().toLowerCase()` search helpers.
- `app/layout.tsx` passes `isAuthDisabled()` into `src/components/providers.tsx`; when auth is enabled, `/signin` uses OpenHands Cloud device flow and FastAPI validates bearer tokens via `/api/v1/users/me`.

- `src/components/dashboard/workspace.tsx` is the OpenHands-inspired Tailwind dashboard workspace using TanStack Query + Zustand, coordinated by the server entrypoint in `src/components/dashboard/page.tsx`.
- `src/components/dashboard/workspace.tsx` now contains the main sidebar-driven dashboard UX with Integrations as the default first section, followed by Agent Connection and User Profile; the server entrypoint for signed-in user routes now lives at `src/components/dashboard/page.tsx`.
- Dashboard branch-coverage regressions are easiest to catch with focused jsdom Vitest suites in `src/components/dashboard/workspace.test.tsx`, `src/components/dashboard/utils.test.ts`, and the section-level test files under `src/components/dashboard/sections/`; these tests use direct `createRoot(...)` rendering plus native DOM events instead of Testing Library in this repo.
- `DashboardPage` should not preload or pass `initialNotifications` into `DashboardWorkspace`; notification data is fetched separately only from the admin-only `/api/notifications` route, and `workspace.test.tsx` should render without any notification seed prop.

- User-facing dashboard and integration UI no longer live under `src/components/admin`. The dashboard is organized under `src/components/dashboard/` (`sections/`, `hooks/`, `shared.tsx`, `utils.ts`), while the integration flow lives under `src/components/integrations/` (`tool-access-controls.tsx` and `wizard/` with step components, state hook, and utilities).
- Shared dashboard sidebar chrome now lives in `src/components/layout/dashboard-sidebar.tsx` and is reused by both the main user-facing dashboard routes and `/admin-integrations`; keep navigation labels/order in that shared component so the sidebars do not drift apart again.
- OAuth callback success/error banners on the dashboard should be derived directly from URL search params (`oauth_status`, `oauth_error`) instead of only mutable wizard status state, so auto-initializing the integration wizard cannot silently clear them.
- Admin dashboard sections now use clean top-level routes only: `/integrations`, `/agent-connection`, and `/profile`. `/home` remains available only as a legacy redirect to `/integrations`; new links and redirects should target the canonical routes directly, with no legacy `/admin` or `?section=` fallback behavior.

- On the Agent Connection panel in `src/components/dashboard/workspace.tsx`, successful API-key copy feedback should use the inline button pattern (temporary check icon) instead of posting a global status banner message.
- The Agent Connection page should keep a compact layout: one top-level API keys card that contains both the restricted agent/runtime key (brief hint: "Give this key to your agent") and the user automation key (brief hint: "Use this key to programmatically set up APIs in the integrations hub"), followed by concise vertically stacked connection sections below named Agent MCP, Agent REST API, and User REST API. In Connection details, keep surfacing the MCP endpoint plus a visible MCP config example, alongside the agent/user OpenAPI schema URLs; REST examples should be short example agent prompts rather than curl blocks. User-key reveal/copy should work for existing keys too: the signed-in dashboard session can re-fetch the current user key from `/api/user/key`, and if an older non-recoverable record is encountered, an explicit reveal/copy action may regenerate it so the user can access the full value again. When a signed-in user has no user automation key yet, the server page auto-issues one for that initial session so there is no separate issue button.
- Agent key rotation now uses the session-authenticated `GET|POST /api/user/agent-key` route, and the Agent Connection dashboard card exposes explicit Rotate actions for agent, user automation, and admin automation keys so leaked keys can be invalidated without deleting the underlying user account or integration setup.

- Function-level access controls now share `src/components/integrations/tool-access-controls.tsx`: the integration wizard review step clears bulk selections after apply, and the dashboard Integration catalog uses the same compact expandable searchable tri-state tool rows with `Hide disabled tools` enabled by default.

- `src/components/integrations/wizard/wizard.tsx` powers a single-form integration onboarding flow: a compact `WizardHeader`, the connector picker + auth/credential controls in `ConnectStep`, then an inline `ReviewStep` that appears below a divider once tools are discovered. There is no top-level Managed/MCP toggle: the form defaults to the managed-connector catalog, and admins get an inline "Use a custom MCP server URL instead" escape hatch (non-admins never see it; the backend still rejects arbitrary URLs from non-admins). The managed-connector picker links users to `/admin-integrations` when they need something new.
- The wizard surfaces OAuth return state in-context via `OAuthReturnBanner` (`shared.tsx`), fed by the structured `oauthStatus` prop that `DashboardWorkspace` derives from the `oauth_status` / `oauth_provider` / `oauth_error` search params. The workspace-level OAuth banner is suppressed while the wizard is open so the success/error message appears once, prominently, inside the flow that the user returns to.
- `src/components/integrations/wizard/use-wizard-state.ts` must also react to `managedConnector` query-param changes after mount, because the dashboard marketplace can open the wizard before Next.js finishes updating `useSearchParams`; keep one-click marketplace launches covered in `workspace.test.tsx` and `use-wizard-state.test.tsx`.
- Managed-connector create payloads sent from the wizard should only include `config.managedConnectorSlug` at save time. Let `IntegrationsHubService.applyManagedConnectorConstraints(...)` rehydrate canonical `serverUrl` / `apiBaseUrl` from the registered connector so non-admin raw-endpoint guardrails do not reject otherwise valid managed installs.
- Explicit user-triggered integration/OAuth route handlers now share `src/lib/route-logging.ts` for info-level request/success/failure logging; use that helper for future create/discover/start/callback style routes instead of open-coding `console.info` payloads. Preserve explicit `IntegrationsHubError` messages, but sanitize unexpected generic errors in route logs to a generic internal-error summary.
- `app/admin-integrations/page.tsx` now routes the registered-connector panel plus curated provider list through a shared client wrapper so deleting or updating a managed connector immediately updates the "Popular official provider options" readiness state without a full page refresh.

- The integrations page now owns both installed integrations and the add-integration marketplace. The add section sources rows from `/api/integrations/managed-connectors`, excludes connectors the current user has already installed, shows the five most popular remaining matches for the current search inside a single full-width card, and each row launches `IntegrationWizard` prefiltered to that connector while returning OAuth/setup flows back to `/integrations`. Installed integrations now expose both `Disable`/`Enable` and `Delete`; deleting a personal integration should also clear its saved per-user connection record.
- Naming cleanup now treats `managedConnector` / `managedConnectorSlug` / discovery kind `"managed"` as the only supported runtime and UI terminology. Legacy `builtIn`, `builtInSlug`, and `built_in` compatibility has been removed; stored integration configs must be backfilled before older installs can continue working.
- The `ReviewStep` panel in `src/components/integrations/wizard/review-step.tsx` uses an alphabetized compact expandable list with search, search-scoped select all/deselect, bulk access actions, and always-visible tri-state access controls (`enabled`, `approval_required`, `disabled`). It renders inline below the connect form (separated by a divider) once discovery succeeds, not as a separate numbered step.
- Runtime tool calls handled through `IntegrationsHubService.invokeContext(...)` now persist per-invocation metadata to a dedicated `tool_invocations` table (owner, agent identity, integration/function, scopes, payload keys, provider/kind/auth, outcome, duration, error summary). Owner integrations returned by the dashboard API are enriched with `lastInvokedAt`, `lastInvocationOutcome`, and `invocationCount` from that table.
- Invocation tracking and auto-created pending access requests are non-critical side effects. `IntegrationsHubService.invokeContext(...)` should treat failures in `createToolInvocation(...)`, `createAccessRequest(...)`, or downstream notification publishing as best-effort warnings only, never as reasons to mask a successful tool response or replace the intended `403 Permission required` / adapter error.

- The Integrations page now includes a one-time bulk action backed by `POST /api/integrations/disable-unused` that disables only currently enabled functions with tracked usage older than a chosen days/weeks/months threshold. Tools with no tracked history are intentionally skipped so new tracking rollout does not mass-disable untouched tools.

- `src/components/admin/integrations/provider-catalog.tsx` renders the `/admin-integrations` researched provider catalog as a compact searchable vertical list; entries are collapsed by default, expand inline, and only show the managed-connector registration form to signed-in users whose email is allowlisted in `INTHUB_APP_ADMIN_EMAILS`.

- `app/admin-integrations/page.tsx` is the canonical user/admin-facing connector request page: regular users see only the “For users” request guidance, admins see only the “For admins” setup guidance plus the registered-connector management panel. In-app admin actions are gated by `INTHUB_APP_ADMIN_EMAILS` from Vercel environment variables.
- `app/admin-integrations/page.tsx` should keep the same sidebar/header chrome and overall card density as the main integrations dashboard, while `src/components/admin/integrations/managed-connector-list.tsx` should keep mirroring the compact integration-card treatment with visible delete actions and logo/avatar tiles.
- `app/admin-overview/page.tsx` is the admin-only operational dashboard for the deployment-wide snapshot exposed by `GET /api/admin/overview`; admins should see a single full-width expandable user browser card that reuses shared dashboard card styling and surfaces per-user saved identities, approval/notification counts, and duplicate external-account groups, while non-admins should only see a gated explanatory card with no cross-owner metrics.

- Admin integrations jsdom tests should prefer stable accessibility hooks that already exist in the UI (`button[aria-expanded]` for provider rows and `button[aria-controls="managed-connector-details-<slug>"]` for managed-connector cards) instead of relying on generic `Show details` text searches or button ordering.

- `src/lib/integrations/integration-catalog.ts` and the FastAPI `/api/integrations/catalog` route expose raw-extension-derived integration catalog options used by the admin-integrations UI.
- FastAPI `/api/integrations/discover` and `src/lib/integrations/discovery.ts` provide server-side function discovery for managed connectors and remote MCP servers.
- Managed connector helper coverage lives in `backend/tests/test_backend_smoke.py` and `backend/tests/test_endpoint_coverage.py`; extend those focused suites for catalog merge/suppression, schema translation, and generated request-template edge cases instead of relying only on service-level tests.
- HubSpot now uses the official remote MCP server at `https://mcp.hubspot.com` with MCP auth-app OAuth (`/oauth/authorize/user`, `/oauth/v3/token`), `clientAuthentication: "body"`, and PKCE. The runtime compatibility shim in `backend/app/managed_connectors.py` / `backend/app/oauth_flow.py` auto-migrates older saved HTTP-style HubSpot connectors to MCP defaults, clears stale indexed HTTP tools, and re-indexes through live MCP discovery without manual DB edits.
- Admin provider-catalog registration payloads must omit blank optional URLs like `openApiUrl`; posting an empty string trips the managed-connector Zod `url()` validation for HTTP connectors that rely on generated tool templates instead of an OpenAPI schema.
- Tools come from a single source of truth per connector — there is no hardcoded fallback tool set. MCP connectors discover tools live via `tools/list` on connect/index; HTTP connectors generate tools from their `openApiUrl` via `generate_openapi_tools` on save/index (`regenerate_http_openapi_tools`, called from `POST /api/managed-connectors`, preserves previously stored per-tool access modes by name). The catalog's per-connector `defaultTool`/`toolScopes` fields are intentionally ignored everywhere (backend `integration_catalog.py`, `managed_connectors.py`, frontend `integration-catalog.ts`, `integration-catalog-panel.tsx`, and `IntegrationConnectionDefaults`). As a result, an HTTP connector without an `openApiUrl` has no tool source and is not surfaced as a default managed connector (`_is_default_managed_connector`); it would expose zero tools until an `openApiUrl` is provided or it is migrated to MCP.

- FastAPI `/api/agent/openapi` generates an authenticated OpenAPI 3.0 document for the caller's currently available tools; it uses the same personal integrations-hub API key as `/api/agent/*`, filters out disabled tools, hides OAuth integrations until that user has connected them, and should keep example payloads/scopes faithful to each function instead of fabricating placeholder args like `scope.read`.
- Dashboard API keys are now split by privilege: the agent key is still the least-privileged tool invocation key, `/api/user/*` uses a distinct user automation key with dashboard-equivalent powers, and allowlisted admins also get a separate admin automation key for `/api/admin/*` QA/ops routes. Do not reuse user/admin auth for agent endpoints, and never expose plaintext key material outside explicit key-management responses.
- `src/lib/admin-api-auth.ts` authenticates `/api/admin/*` bearer or `X-API-Key` requests against stored admin automation keys and re-checks `INTHUB_APP_ADMIN_EMAILS`; FastAPI `/api/admin/openapi` documents the admin QA surface, while the dashboard shows the admin key/API docs only for admin users.
- `GET /api/admin/connections` now pushes exact-match `ownerId` / `provider` / `integrationKey` filters down to `PostgresRepository.listAllIntegrationConnections(...)` and applies only substring `q` matching in service memory. Keep the route/OpenAPI pagination contract aligned with the current defaults of `limit=100` and `offset=0`.
- Deployment-wide admin inspection now also includes `GET /api/admin/overview` for concise operational counts plus duplicate external-account detection. Duplicate external-account groups are intentionally case-insensitive on normalized `provider` + `externalAccountId` and ignore connections missing an external account id. These routes are intentionally global/admin-only and should not leak provider metadata or encrypted credentials.
- Terminology standardization should prefer `tool` for new internal helper/type/state names (for example `ToolSpec`, `ToolAccessMode`, `toolModes`, `visibleTools`), while preserving compatibility on stable/external surfaces that intentionally remain function- or skill-shaped, such as `integration.tools`, `/api/agent/skill`, and generated `SKILL.md` downloads.


- Admin-managed connectors are service-level registrations: admins register either a remote MCP endpoint or a managed HTTP/OpenAPI definition plus OAuth metadata once, then each user separately connects their own account in the wizard. MCP discovery loads live tools from the remote server, while HTTP/OpenAPI discovery uses the generated tool templates stored on the managed connector.
- The admin-integrations provider catalog now pre-fills provider-specific managed-connector defaults from official provider surfaces: known official MCP URLs are used where available (currently GitHub Copilot and Slack), and most other catalog entries default to the provider's official REST API/OpenAPI details instead. `src/components/admin/integrations/provider-catalog.tsx` synthesizes a starter HTTP function template from the catalog metadata when no OpenAPI URL is available, while the UI still shows the OpenAPI source when a managed HTTP connector will be generated from it. The registration form hides scopes/authorization/token fields when those OAuth defaults are already known in source, keeps only a single OAuth docs link, and auto-populates the callback URL with the current deployment origin in the browser (falling back to `https://<your-deployment>/api/oauth/<provider>/callback` during server render).
- Managed connectors now provide a data-driven escape hatch for common nonstandard integrations: admins can upsert DB-backed connector definitions through FastAPI `/api/managed-connectors`, but `POST` is restricted to signed-in users allowlisted in `INTHUB_APP_ADMIN_EMAILS`; `backend/app/main.py` (`invoke_http_tool`) executes their request templates, and `backend/app/oauth_flow.py` turns stored OAuth client metadata into runtime OAuth providers.
- HTTP request templates are now intentionally narrow: request paths may embed `{{variable}}` placeholders, but query/header/body strings only support whole-value placeholders (for example `"{{body}}"`), not mixed literal interpolation like `"Bearer {{token}}"` or `"prefix-{{id}}"`. Keep `src/lib/http-request-template.ts` as the shared source of truth for validation and variable discovery.
- `HttpAdapter` should treat malformed top-level `headers` templates the same way it already treats malformed `query` templates: if a resolved template is not a record, ignore it rather than spreading string indices into `fetch` headers.


- Org-admin tool ceilings are now enforced through indexed managed-connector function definitions: admins index tools at `POST /api/managed-connectors/[slug]/functions`, set per-tool `accessMode` on the managed connector, and user-installed integrations inherit those definitions as `maxAccessMode` so user UI and backend mutations both clamp access to the admin-selected ceiling.
- Managed HTTP/OpenAPI connector updates must preserve previously indexed per-tool `accessMode` values when regenerating function definitions; admin ceiling reductions should immediately clamp user-visible tool access, while later admin ceiling increases must not silently raise an individual user's stored access mode.
- `backend/app/managed_connectors.py` exposes catalog-backed default managed connectors for connectors that need no service-level admin action (ElevenLabs via HTTP/api_key, Ordinal via MCP/bearer). These defaults are merged into both `/api/integrations/managed-connectors` (wizard) and `/api/admin/managed-connectors` (admin list) unless a DB-backed managed connector with the same slug already exists (disabled records suppress the default).
- Case-by-case tool invocations now auto-register an in-app pending access request the first time an approval-required function is denied; duplicate pending requests for the same agent/class/integration/function/scopes are deduplicated until resolved.
- The dashboard now has a dedicated `/case-by-case-approvals` section/page for approval review, with newest-first sorting, search, and select-all/bulk approve-or-deny actions. MCP approval-required responses should link humans to that page instead of `/integrations`.
- The dashboard approval UI now uses session-authenticated `/api/case-by-case-approvals*` routes for owner-scoped review, while `/api/admin/access-requests*` remains the all-requests admin automation surface. Never trust a client-supplied reviewer identity for approval decisions; derive the approver from the authenticated session or admin API key instead.
- `IntegrationsHubService` may still persist static per-user credentials on `owner_integrations`, but any dashboard/user-facing integration responses must redact `integration.credentials` so browser clients never receive stored third-party secrets back.

- New OAuth managed connectors must be registered with both `oauthClientId` and `oauthClientSecret`; otherwise they should not be considered wizard-ready. The admin-integrations UI now blocks incomplete registrations, marks successful ones as ready locally, and the integration wizard refetches `/api/integrations/managed-connectors` on step 2 so freshly registered connectors show up instead of stale cached data.
- `/admin` naming has been retired from user-facing component structure even though the dashboard remains shared by regular users and admins. Personal integrations, OAuth connection state, enable/disable controls, and tool access controls now live under `src/components/dashboard/` and `src/components/integrations/`, while service-level connector/OAuth app administration remains under `src/components/admin/integrations/`. There is no shared/global integration installation layer in runtime or storage.

- `MemoryRepository` and the TypeScript DB layer have been completely removed. The Python backend (`backend/app/repository.py`) owns all DB access via `PostgresRepository`. If `INTHUB_POSTGRES_URL` is missing at runtime, signed-in users see a service-unavailable screen; admins see setup instructions for configuring Postgres, and normal users see a generic unavailable message.
- All backend tests run via `cd backend && uv run pytest tests -q` using the real `PostgresRepository` against an in-process test DB (no PGlite needed). Frontend component tests run via `npx vitest run` using jsdom with mocked `fetch`.
- `backend/app/repository.py` bootstraps schema lazily on first use. On Neon/Vercel, concurrent serverless requests can race on `CREATE TABLE IF NOT EXISTS`, so schema initialization runs inside a single transaction guarded by `pg_advisory_xact_lock(...)`, plus an in-process promise dedupe to avoid duplicate work within one runtime instance.
- MCP transport handling is centralized in `backend/app/main.py` (`discover_mcp_tools`, `invoke_mcp_tool`, `mcp_call`). Discovery and runtime invocation enforce a 10s timeout for MCP connect/operation calls and log transport failures server-side, while any optional retry policy is metadata-driven via ordered `config.mcpTransportOrder` entries rather than hardcoded provider checks in the generic client.
- MCP client/runtime tests should model multi-transport retries by passing explicit `transportOrder` entries. Do not rely on legacy provider-specific fallback assumptions (for example, implicit Notion SSE retries) or deprecated debug fields like `fallbackUrl`.
- `backend/app/main.py` should preserve numeric SDK transport error codes (for example hosted MCP 401/403 responses) when wrapping failures into `HTTPException`, so routes return the real auth/scope status instead of collapsing everything to 502. Provider-specific hints, if added, must stay sanitized and avoid echoing secrets.
- `backend/app/main.py` now includes debug details in JSON error responses only when the current session email is allowlisted in `INTHUB_APP_ADMIN_EMAILS`. Any debug payload must stay sanitized (presence/length/whitespace flags, transport attempts, config identifiers) and must never include raw OAuth tokens, API keys, or decrypted secrets.
- The combined dashboard API keys card must only server-render metadata for user/admin automation keys. Plaintext user/admin key material should be fetched from `/api/user/key` or `/api/admin/key` with `cache: "no-store"` only after an explicit reveal/copy action, and missing keys should be generated only through those explicit client actions rather than during server render.
- Admin automation key issuance and lookup are service-layer gated: only allowlisted `INTHUB_APP_ADMIN_EMAILS` owners may rotate/read/revoke admin keys, and deallowlisted admin-key hashes should authenticate as unauthorized instead of exposing legacy records.
- MCP discovery should only infer `api_key` auth when a secret is present; a default header name by itself should still resolve to `none`, which matters for local proxy-based QA.
- Local QA can be exercised with `npm run dev` on localhost plus a tiny localhost proxy that forwards `http://127.0.0.1:12001/` to GitHub's hosted MCP using `GITHUB_TOKEN`; the dashboard provisions a per-user agent API key server-side, and agents cannot call `/api/agent/*` until a user has opened `/integrations` once to provision that key.
- `ToolSpec.accessMode` now supports `enabled`, `disabled`, and `approval_required`; `approval_required` bypasses agent-class policy and requires a temporary grant, while `enabled` functions are callable by default unless a matching agent-class policy is configured to narrow access.
- Stored provider credentials require a dedicated `INTHUB_CREDENTIAL_ENCRYPTION_KEY` in every environment; there is no baked-in local-development encryption fallback.
- FastAPI `/api/cron/expire-grants` is intended for a Vercel cron job to purge expired temporary grants, and it must fail closed unless `INTHUB_CRON_SECRET` is configured and presented as a bearer token.
- `.github/workflows/` now includes the OpenHands PR review pair (`pr-review.yml`, `pr-review-evaluation.yml`) plus the vulnerability remediation wrapper (`vulnerability-scan.yml`) copied from `OpenHands/extensions` plugins.
- The app favicon now mirrors the OpenHands frontend assets: `public/favicon.ico`, `public/favicon-16x16.png`, and `public/favicon-32x32.png`, referenced explicitly via `app/layout.tsx` metadata.

- `app/globals.css` plus `src/components/ui/{button,badge,card}.tsx` now mirror the OpenHands frontend palette more closely: gold primary accents (`#c9b974`/`#cfb755`), flatter dark surfaces, system sans body text, and IBM Plex Mono for code; admin/dashboard styling should stay aligned with those shared primitives.
- Enabled dashboard/admin `<button>` controls should include pointer-cursor affordances. The shared `Button` primitive now carries `cursor-pointer`, but raw `<button>` wrappers (marketplace cards, kind selectors, segmented controls, disclosure rows) still need explicit `cursor-pointer` classes when added outside that primitive.

