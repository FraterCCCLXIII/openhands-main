# API and Route Guide

This repository exposes three main surfaces: dashboard pages for humans, agent-facing runtime interfaces, and automation APIs for signed-in users/admins.

## Dashboard routes

| Route | Audience | Purpose |
| --- | --- | --- |
| `/` | Everyone | Landing page |
| `/integrations` | Signed-in users | Install integrations, manage function access, connect OAuth providers |
| `/agent-connection` | Signed-in users | Manage API keys, permission profiles, and REST/MCP connection examples |
| `/profile` | Signed-in users | Profile details |
| `/case-by-case-approvals` | Allowlisted admins | Review and decide approval-required access requests |
| `/admin-integrations` | Allowlisted admins | Manage service-level managed connectors and provider defaults |

Legacy redirects:

- `/home` → `/integrations`
- `/permission-profiles` → `/agent-connection`

## Agent runtime interfaces

### REST tool invocation

- `POST /api/agent/[integrationKey]/[toolName]`
- Auth: personal agent/runtime API key (`cla_...`)
- Generated schema: `GET /api/agent/openapi`
- Generated tool catalog markdown: `GET /api/agent/skill`

### MCP server

- `POST /api/mcp`
- Auth: personal agent/runtime API key (`cla_...`)
- Tool names are namespaced as `<integration>__<function>`

## User automation API

- Base docs: `GET /api/user/openapi`
- Auth: user automation API key (`clu_...`)
- Primary routes:
  - `GET /api/user/integrations`
  - `PATCH /api/user/integrations/[integrationKey]/tools/[toolName]`
  - `GET|POST /api/user/key`
  - `GET|POST /api/user/agent-key`
  - `GET /api/user/access-requests`
  - `POST /api/user/access-requests/[requestId]/approve`
  - `POST /api/user/access-requests/[requestId]/reject`

## Admin automation API

- Base docs: `GET /api/admin/openapi`
- Auth: admin automation API key (`clad_...`)
- Primary routes:
  - `GET /api/admin/connections`
  - `GET /api/admin/overview`
  - `GET|POST /api/admin/managed-connectors`
  - `DELETE /api/admin/managed-connectors/[slug]`
  - `POST /api/admin/integrations/discover`
  - `GET /api/admin/integrations/managed-connectors`
  - `GET /api/admin/integrations/catalog`
  - `GET /api/admin/notifications`
  - `GET /api/admin/access-requests`

## Integration requests

- `POST /api/integrations/requests`
- Auth: signed-in dashboard session
- Body: `{ source: "catalog" | "custom", slug?, name?, description?, docsUrl?, notes? }`
- Catalog requests must use a researched-provider slug that is not already in the enabled integrations catalog.
- Custom requests require a name plus optional description, docs URL, and notes for the admin.
- Stored as an in-app admin notification so deployment admins can register the connector.
- Admins review pending requests on `/admin-user-requests`.
- `GET /api/admin/integration-requests` lists stored requests (pending, added, and dismissed).
- `POST /api/admin/integration-requests/{requestId}/add` marks a pending request as added.
- `POST /api/admin/integration-requests/{requestId}/dismiss` marks a pending request as dismissed.

## Related generated docs

- `src/lib/agent-connection.ts` builds the connection examples shown in the dashboard
- `src/lib/agent-skill.ts` builds the downloadable `SKILL.md` tool catalog
- `backend/app/main.py` (`agent_openapi`) builds the agent runtime OpenAPI document
- `src/lib/user-openapi.ts` and `src/lib/admin-openapi.ts` build the automation API documents
