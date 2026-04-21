# Architecture, Security Model, and Testing Strategy

This document gives contributors one place to understand how the context layer is secured, how it is tested, and what the main domain concepts mean.

It complements:

- [README.md](./README.md) for product-level orientation and setup
- [API.md](./API.md) for route and surface area maps
- [CONTRIBUTING.md](./CONTRIBUTING.md) for the contribution workflow
- [AGENTS.md](./AGENTS.md) for repository memory and implementation notes

## System model

At a high level, the repository separates three concerns:

1. **Human control surfaces**: the dashboard and signed-in management APIs.
2. **Agent runtime surfaces**: the restricted REST and MCP interfaces that agents call.
3. **Connector execution**: managed HTTP/OpenAPI integrations and remote MCP integrations that resolve each user's credentials server-side at invocation time.

That split is the core security idea of the repo: agents get a narrow context-layer interface, while humans keep control over connector registration, per-user credentials, and approval workflows.

## Security model

### Actors and trust boundaries

| Actor | What they can do | What they should not get |
| --- | --- | --- |
| Signed-in user / owner | Install integrations for themselves, connect OAuth accounts, manage their own tool access, use the user automation API | Other users' credentials, admin-only APIs, service-level connector control unless they are allowlisted admins |
| Allowlisted admin | Everything a normal signed-in user can do, plus manage service-level connectors, admin automation keys, and approval review flows | Direct access to raw provider credentials in client-side UI |
| Agent | Call the restricted runtime interfaces with a `cla_...` key and the owner's currently available tools | Dashboard-equivalent powers, admin APIs, raw third-party credentials |
| Provider / remote tool server | Receive the final outbound request after the context layer resolves credentials and access checks | Other unrelated connector secrets or dashboard session state |

Important boundaries:

- **Dashboard auth** identifies a human.
- **Runtime auth** identifies an owner-scoped agent session.
- **Agent identity metadata** (`agentId`, `agentClass`, optional `contextScopes`) affects authorization decisions, but it is not itself the authentication credential.

### Authentication surfaces and key types

| Surface | Auth mechanism | Scope |
| --- | --- | --- |
| Dashboard pages | Auth.js GitHub sign-in, or `DISABLE_AUTH=true` for localhost-only development | Human dashboard access |
| Agent REST runtime (`/api/context/*`) | Personal agent/runtime key `cla_...` | Least-privileged tool invocation only |
| MCP runtime (`/api/mcp`) | Personal agent/runtime key `cla_...` | Same least-privileged runtime surface via MCP |
| User automation API (`/api/user/*`) | User automation key `clu_...` | Dashboard-equivalent management for the authenticated owner |
| Admin automation API (`/api/admin/*`) | Admin automation key `clad_...` | Admin-only connector and approval operations |

Key rules:

- `cla_...` keys are for runtime invocation only. They should not be accepted for `/api/user/*` or `/api/admin/*`.
- `clu_...` keys are owner-scoped and should map to the same owner-visible management surface as the signed-in dashboard.
- `clad_...` keys are available only to emails allowlisted in `APP_ADMIN_EMAILS` and are re-checked against that allowlist during auth.
- When `DISABLE_AUTH=true`, the app is intentionally limited to loopback requests so local auth bypass does not become a shared-environment escape hatch.

### Authorization model

Authorization is layered. A runtime call only succeeds when all relevant checks pass:

1. **Valid runtime credential**: the caller presents a valid `cla_...` key.
2. **Owner resolution**: that runtime key resolves to a specific owner.
3. **Installed integration availability**: the owner has an enabled integration installed, and OAuth-backed integrations also need a live per-user connection before they become callable.
4. **Tool access mode**: the resolved tool is `enabled` or has an active temporary grant if it is `approval_required`.
5. **Agent policy narrowing**: `agentId`, `agentClass`, and scopes may further restrict access when agent-class policy is configured.

The important distinction between access modes is:

- `enabled`: callable by default unless a matching agent-class policy narrows access further.
- `disabled`: hidden from normal use and should not be invokable.
- `approval_required`: never callable just because it exists; it needs a matching temporary grant.

There is also an **admin ceiling** on managed connectors:

- service-level managed connectors can define a per-tool `maxAccessMode`
- user-installed integrations inherit that ceiling
- user-visible access settings cannot exceed the admin-selected ceiling

### Enabled flow vs approval-required flow

#### Enabled tool flow

1. A user installs an integration and keeps a tool `enabled`.
2. An agent calls `/api/context/...` or `/api/mcp` with a `cla_...` key.
3. The context layer resolves the owner, validates the integration, loads that owner's connection details if needed, and invokes the downstream connector.
4. Invocation metadata is recorded as a best-effort audit side effect.

#### Approval-required tool flow

1. A user or admin marks a tool `approval_required`.
2. The next runtime call for that tool is denied unless there is already a matching active temporary grant.
3. The denial path can create a pending access request as a **best-effort** side effect; repeated requests for the same owner/agent/tool/scope tuple are deduplicated while still pending.
4. An allowlisted admin reviewer approves or rejects the request from `/case-by-case-approvals` or the admin approval APIs.
5. Approval creates a temporary grant scoped to the agent metadata, tool, and scopes, with an expiry time.
6. Future invocations succeed only while that grant remains active.
7. Expired grants are purged by the cron route at `/api/cron/expire-grants` when called with `CRON_SECRET`.

MCP-specific note:

- Approval-required MCP requests must set agent metadata with `set_agent_data` and a `conversationLink` before the server will create a pending approval request. That link lets reviewers navigate back to the originating conversation.

### Secret and credential storage

The repository keeps credential material server-side and resolves it only at invocation time. User-facing dashboard and automation APIs should return redacted integration records rather than replaying stored third-party secrets back to clients.

#### Stored secret types

| Secret type | Where it lives | Storage model |
| --- | --- | --- |
| User OAuth / provider credentials | `integration_connections.encrypted_credentials` | Encrypted at rest |
| Static per-user API key / bearer / basic credentials | `owner_integrations.credentials` | Stored server-side and redacted from user-facing responses; not yet covered by the encrypted connection-record path |
| Managed connector OAuth client credentials | `managed_connectors.encrypted_oauth_client` | Encrypted at rest |
| User automation keys | `user_api_keys` | SHA-256 hash for auth lookup plus encrypted recovery copy for explicit reveal/copy |
| Admin automation keys | `admin_api_keys` | SHA-256 hash for auth lookup plus encrypted recovery copy for explicit reveal/copy |
| Agent runtime keys | `agent_api_keys.api_key` | Stored directly and used only for owner-scoped runtime auth |

#### Encryption behavior

Stored credential encryption uses `CREDENTIAL_ENCRYPTION_KEY` only.

Important operational rules:

- `CREDENTIAL_ENCRYPTION_KEY` must be configured anywhere encrypted credential storage is used.
- There is no baked-in development fallback key.
- Provider credentials should live in per-user integration connection records, not inside shared integration specs.
- Agents receive generated docs and invocation results, not raw provider secrets.

### Owner, user, and admin permission boundaries

- **Owner** is the normalized identity that owns runtime keys, installed integrations, and per-user provider connections.
- **Regular signed-in users** can manage only their own installations, keys, and OAuth connections.
- **Allowlisted admins** can additionally register service-level managed connectors, manage indexed tool ceilings, use admin automation APIs, and review approvals.
- **Agents** act on behalf of an owner through the least-privileged runtime key and do not inherit dashboard or admin privileges.

## Testing strategy

### Testing philosophy

Tests should exercise real repository and service behavior whenever practical. The repo intentionally does **not** use an in-memory repository fallback for automated tests.

Instead, tests run against a real `PostgresRepository` backed by PGlite, which gives fast in-process Postgres semantics while still exercising schema creation, SQL queries, and service orchestration.

### Test layers

| Layer | Typical target | Command |
| --- | --- | --- |
| Unit tests | Pure helpers, UI components, route handlers, service logic with focused stubs | `npm run test:unit` |
| Repository / SQL tests | `PostgresRepository` behavior, schema changes, row mapping, persistence semantics | `npm run test:e2e` |
| Service-stack end-to-end tests | Real service + repository flows such as key issuance, grants, and integration persistence | `npm run test:e2e` |
| Full local validation | Combined regression pass before merge | `npm run test:unit && npm run test:e2e && npm run typecheck && npm run build` |

In this repository, `test:e2e` means **real DB-backed end-to-end coverage inside Vitest**, not browser automation.

### When to use PGlite-backed tests

Use the standard PGlite-backed repository setup whenever a change touches:

- Postgres schema or row mapping
- repository queries
- service logic that depends on stored integrations, keys, grants, or connection records
- OAuth persistence or credential resolution paths
- access request, temporary grant, or invocation tracking behavior

The standard pattern is:

```ts
import { afterEach, beforeEach, vi } from "vitest";

import { createTestRepository, getActiveSql } from "@/src/lib/db/pglite-test-utils";

vi.mock("@neondatabase/serverless", () => ({ neon: () => getActiveSql() }));

let cleanup: (() => Promise<void>) | undefined;

beforeEach(async () => {
  ({ cleanup } = await createTestRepository());
});

afterEach(async () => {
  await cleanup?.();
});
```

That pattern keeps repository-backed tests aligned with the real SQL schema instead of drifting into mock-only coverage.

### What to test for common changes

| Change type | Expected test approach |
| --- | --- |
| Pure documentation change | No new tests required |
| UI behavior change | Add or update focused component / route tests |
| Service authorization or access-mode change | Add service tests and use PGlite when persistence matters |
| Schema / repository change | Add PGlite-backed repository coverage |
| New integration/provider support | Test discovery plus the layer you changed (catalog, OpenAPI generation, MCP behavior, OAuth resolution, or runtime invocation) |

Additional repo-specific expectations:

- Prefer testing real code paths over heavy mocks.
- Keep tests close to the layer you changed.
- If a change affects both service logic and persistence semantics, cover both.
- Documentation-only changes do not need new tests, but contributors should still run relevant existing checks when practical.

### Validation commands before merge

Useful commands, from fastest to fullest:

#### Fast local gate

```bash
.openhands/pre-commit.sh
```

That script bootstraps the environment, runs `npm run typecheck`, and then runs `npm test`.

#### Full repo validation

```bash
npm run test:unit
npm run test:e2e
npm run typecheck
npm run build
```

#### Additional quality checks used in CI or useful before larger changes

```bash
npm run lint
npm run audit
```

Current CI mapping:

- `.github/workflows/unit-tests.yml` runs `npm run audit`, `npm run typecheck`, and `npm run test:unit`
- `.github/workflows/e2e-tests.yml` runs `npm run test:e2e`

## Domain glossary

| Term | Meaning in this repository |
| --- | --- |
| Context layer | The owner-scoped service that sits between agents and external providers and exposes the controlled REST/MCP runtime surfaces |
| Owner | The normalized signed-in identity that owns runtime keys, installed integrations, and per-user connection records |
| Allowlisted admin | An owner whose email is present in `APP_ADMIN_EMAILS`, unlocking service-level connector and admin API operations |
| Agent runtime key (`cla_...`) | Least-privileged key used only for `/api/context/*`, `/api/context/openapi`, `/api/context/skill`, and `/api/mcp` |
| User automation key (`clu_...`) | Owner-scoped automation key for `/api/user/*` routes |
| Admin automation key (`clad_...`) | Admin-only automation key for `/api/admin/*` routes |
| Managed connector | A service-level connector definition registered once by admins and reused by many owners |
| Built-in connector | A catalog-backed managed connector definition that ships as a repo default unless a DB-backed record overrides it |
| Owner integration | A user's installed instance of a connector, including enablement state and per-tool access modes |
| Integration connection | The per-owner stored credential record used to actually authenticate to a provider at runtime |
| Tool | The callable unit exposed to agents; some external or legacy surfaces still use the word “function” |
| Access mode | The user-visible runtime mode for a tool: `enabled`, `disabled`, or `approval_required` |
| Max access mode | The admin-managed ceiling that clamps how permissive a user can make a tool on a managed connector |
| Access request | A pending human review item created when an approval-required tool is requested without an active grant |
| Temporary grant | A time-limited approval record that unlocks one approval-required tool for a matching agent identity and scope set |
| Agent ID | Optional runtime metadata used to distinguish a specific agent instance for policy and grant matching |
| Agent class | Optional runtime metadata used to group agents for policy and grant matching |
| Scopes | Optional runtime scope labels used by access policy and temporary grant matching |
| MCP session defaults | Session-scoped values set by `set_agent_id`, `set_agent_class`, and `set_agent_data` to avoid repeating agent metadata on every MCP call |
| Invocation tracking | Best-effort recording of tool call metadata in `tool_invocations` for usage and audit summaries |

## Contributor checklist for security-sensitive changes

When a change touches auth, credentials, access control, or approvals, verify all of the following:

- the surface is using the correct key type
- the change does not widen agent privileges accidentally
- secrets remain server-side and encrypted where expected
- approval-required tools still require grants and create reviewable requests where applicable
- PGlite-backed tests cover any persistence or policy behavior you changed
- README / API / generated-doc references stay aligned with the actual runtime behavior
