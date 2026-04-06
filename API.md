# API and Route Guide

This repository exposes three main surfaces: dashboard pages for humans, agent-facing runtime interfaces, and automation APIs for signed-in users/admins.

## Dashboard routes

| Route | Audience | Purpose |
| --- | --- | --- |
| `/` | Everyone | Landing page |
| `/integrations` | Signed-in users | Install integrations, manage function access, connect OAuth providers |
| `/agent-connection` | Signed-in users | View keys plus REST/MCP connection examples |
| `/profile` | Signed-in users | Profile details |
| `/case-by-case-approvals` | Signed-in admins/users reviewing requests | Review and decide approval-required access requests |
| `/admin-integrations` | Allowlisted admins | Manage service-level managed connectors and provider defaults |

Legacy redirects:

- `/home` → `/integrations`
- `/add-connector` → `/admin-integrations`

## Agent runtime interfaces

### REST tool invocation

- `POST /api/context/[integrationKey]/[toolName]`
- Auth: personal agent/runtime API key (`cla_...`)
- Generated schema: `GET /api/context/openapi`
- Generated tool catalog markdown: `GET /api/context/skill`

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
  - `GET /api/user/access-requests`
  - `POST /api/user/access-requests/[requestId]/approve`
  - `POST /api/user/access-requests/[requestId]/reject`

## Admin automation API

- Base docs: `GET /api/admin/openapi`
- Auth: admin automation API key (`clad_...`)
- Primary routes:
  - `GET|POST /api/admin/managed-connectors`
  - `DELETE /api/admin/managed-connectors/[slug]`
  - `POST /api/admin/integrations/discover`
  - `GET /api/admin/integrations/built-in-connectors`
  - `GET /api/admin/integrations/oauth-provider-catalog`
  - `GET /api/admin/notifications`
  - `GET /api/admin/access-requests`

## Related generated docs

- `src/lib/agent-connection.ts` builds the connection examples shown in the dashboard
- `src/lib/agent-skill.ts` builds the downloadable `SKILL.md` tool catalog
- `src/lib/context-openapi.ts` builds the agent runtime OpenAPI document
- `src/lib/user-openapi.ts` and `src/lib/admin-openapi.ts` build the automation API documents
