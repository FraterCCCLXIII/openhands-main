---
name: adding-integrations
description: Add a new integration to the OpenHands Context Layer codebase. Use when implementing a new provider, choosing between MCP and HTTP/OpenAPI, wiring OAuth or API-key auth, or validating that a connector actually works.
triggers:
- add integration
- new integration
- managed connector
- oauth provider
- mcp integration
- openapi integration
---

# Adding Integrations

Use this skill when the task is to add or update provider support in this repository.

In this codebase, most integration work should be **data-driven**, not framework-building. Start by choosing the closest existing shape and only add new runtime logic when the provider cannot fit the current managed-connector, OpenAPI, or MCP paths.

## Best reference PRs

Start from the closest merged example instead of designing from scratch:

- [#32 Add ElevenLabs managed connector support](https://github.com/OpenHands/context-layer/pull/32)
  - API-key HTTP/OpenAPI connector
  - good reference for `apiKeyHeaderName`, generated HTTP functions, multipart support, and binary responses
- [#33 Use Slack's official hosted MCP connector defaults](https://github.com/OpenHands/context-layer/pull/33)
  - OAuth-backed hosted MCP connector
- [#46 Add Ordinal MCP as a supported provider](https://github.com/OpenHands/context-layer/pull/46)
  - bearer-token MCP connector
- [#64 Add Webflow managed MCP integration](https://github.com/OpenHands/context-layer/pull/64)
  - catalog-driven hosted MCP registration
- [#74 Fix Webflow MCP OAuth registration flow](https://github.com/OpenHands/context-layer/pull/74)
  - provider-specific OAuth details, PKCE, and dynamic client registration

## Step 1: Gather provider facts before writing code

Do not start editing until you know:

1. **Runtime surface**
   - official MCP server, or
   - stable REST API with an official OpenAPI schema, or
   - manual HTTP fallback if neither exists

2. **Auth model**
   - `oauth2`, `api_key`, `bearer`, `basic`, or `none`
   - for OAuth: auth URL, token URL, scopes, scope separator, PKCE, client authentication mode, and whether dynamic client registration is required
   - for API keys: exact header name or parameter name

3. **Base URLs**
   - MCP server URL, API base URL, and OpenAPI schema URL if applicable

4. **One low-risk smoke test**
   - pick a read-only validation action such as profile lookup, search, or list

5. **Provider quirks**
   - multipart uploads
   - text or form bodies
   - binary responses
   - hosted MCP transport quirks
   - provider-specific OAuth params

Sources should be official provider docs first, then the reference PRs above.

## Step 2: Choose the smallest integration shape

Use this table:

| Shape | Usually update |
| --- | --- |
| HTTP/OpenAPI + API key | `src/lib/integrations/oauth-provider-catalog.ts`, `src/lib/integrations/oauth-provider-registration-defaults.ts`, tests |
| HTTP/OpenAPI + OAuth | same as above, plus OAuth-specific tests or runtime changes only if the provider is non-standard |
| MCP + bearer/API key | catalog + registration defaults + discovery/runtime tests |
| MCP + OAuth | catalog + registration defaults + OAuth tests; runtime only if the provider has transport/auth quirks |
| HTTP provider without usable OpenAPI | manual function definitions and possibly `src/lib/adapters/http-adapter.ts` / `src/lib/managed-connectors/openapi.ts` |

If the provider matches ElevenLabs, Slack, Ordinal, Notion, or Webflow, copy that path first.

## Step 3: Touch the right files

### Usually touched

- `src/types/context-layer.ts`
  - only if the provider genuinely needs a new shared type or auth/config field
- `src/lib/integrations/oauth-provider-catalog.ts`
  - curated metadata: slug, name, availability, docs URL, notes, categories, `builtInSlug`
- `src/lib/integrations/oauth-provider-registration-defaults.ts`
  - runtime defaults: `provider`, `authStrategy`, URLs, scopes, credential labels, and OpenAPI or MCP defaults
- matching tests for the files above

### Touch only when needed

- `src/lib/integrations/discovery.ts`
  - discovery branching for built-ins, managed connectors, HTTP/OpenAPI, and MCP
- `src/lib/managed-connectors/openapi.ts`
  - when the provider's schema uses request-body or parameter features not already supported
- `src/lib/adapters/http-adapter.ts`
  - when runtime execution needs new HTTP behavior
- `src/lib/mcp-client.ts`
  - when a hosted MCP server needs special transport/auth handling
- `src/lib/oauth/managed-oauth-client.ts`
- `src/lib/oauth/provider-resolver.ts`
  - when the provider has non-standard OAuth behavior
- `src/components/admin/*`
  - only if the admin/installation UX truly needs to change

## Step 4: Apply the common implementation pattern

### For HTTP/OpenAPI + API key

Use the ElevenLabs shape:

- `provider: "http"`
- `authStrategy: "api_key"`
- `authModes: ["api_key"]`
- `apiKeyHeaderName`
- `apiBaseUrl`
- `openApiUrl`
- clear credential labels/help text

### For HTTP/OpenAPI + OAuth

Use the Notion shape:

- `provider: "http"`
- `authStrategy: "oauth2"`
- `apiBaseUrl`
- `openApiUrl`
- OAuth URLs and scopes
- one read-only operation suitable for validation

### For MCP + bearer token

Use the Ordinal shape:

- `provider: "mcp"`
- `authStrategy: "bearer"`
- `serverUrl`
- clean credential label/placeholder/help text

### For MCP + OAuth

Use the Slack or Webflow shape:

- `provider: "mcp"`
- `authStrategy: "oauth2"`
- `authorizationUrl`
- `tokenUrl`
- `scopes`
- `pkce`, `clientAuthentication`, and `registrationUrl` when needed

## Step 5: Understand the runtime path you are validating

### Discovery

`src/lib/integrations/discovery.ts` decides whether a built-in or managed connector is discovered through:

- MCP discovery, or
- OpenAPI-generated HTTP function definitions

Do not change discovery unless the provider cannot be represented by the existing branches.

### Managed-connector persistence

`src/lib/core/service.ts` handles managed connector upsert logic, including:

- normalizing provider defaults
- generating HTTP functions from OpenAPI when `openApiUrl` is present
- validating OAuth config and storing encrypted OAuth clients

### Invocation

`src/lib/core/service.ts` `invokeContext(...)` is the real runtime path. A connector is only done when discovery succeeds **and** a real invocation succeeds.

## Step 6: Add tests for the code you changed

Typical coverage:

- `src/lib/integrations/oauth-provider-catalog.test.ts`
- `src/lib/integrations/discovery.test.ts`
- `src/lib/mcp-client.test.ts` when MCP behavior changes
- `src/lib/oauth/provider-resolver.test.ts` when OAuth behavior changes
- `src/lib/managed-connectors/openapi.test.ts` when schema-generation behavior changes
- UI tests only when installation/admin flows visibly change

For documentation-only follow-ups, do not add tests. For actual integration behavior changes, add tests in the same layer you modified.

## Step 7: Validate the connector end to end

### Automated checks

Run the full safety net before shipping:

```bash
npm test
npm run test:e2e
npm run typecheck
npm run build
```

### Local app validation

Run the app:

```bash
DISABLE_AUTH=true npm run dev
```

Then use:

- `/integrations`
- `/admin-integrations` when you need admin registration
- `/agent-connection` for runtime connection details

### Manual validation checklist

1. Install or register the connector in the dashboard.
2. Confirm the UI matches the auth model:
   - OAuth redirects and stores a user connection
   - API key / bearer asks for the right credential input
   - MCP connectors discover real tools
   - HTTP/OpenAPI connectors generate sensible functions
3. Verify function discovery succeeds.
4. Invoke at least one real, read-only function.
5. Confirm the result comes back through the real runtime path rather than only through unit tests.

Useful agent/runtime surfaces:

- `GET /api/context/skill`
- `GET /api/context/openapi`
- `POST /api/context/{integrationKey}/{functionName}`
- `POST /api/mcp`

## Common mistakes

- Adding new abstractions before confirming the existing managed-connector path is sufficient
- Treating OAuth as install-time static credentials instead of per-user connections
- Stopping after catalog visibility without proving discovery and invocation
- Adding UI complexity when the provider fits the existing wizard
- Validating only with unit tests and never doing a real smoke test

## Rule of thumb

This repository already has the core patterns. Your default job is to identify the right one, fill in high-quality provider metadata, add tests at the layer you changed, and prove a real tool call works.