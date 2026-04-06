# Contributing

Thanks for contributing to OpenHands Context Layer.

## Prerequisites

- Node.js 22.12 or newer
- npm
- A Postgres connection string in `POSTGRES_URL` or `DATABASE_URL` for running the app locally

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Configure `POSTGRES_URL` or `DATABASE_URL`.

4. Start the app:

   ```bash
   npm run dev
   ```

   For localhost-only development without interactive sign-in:

   ```bash
   DISABLE_AUTH=true npm run dev
   ```

5. Open `http://localhost:3000/integrations`.

## Validation

Run the checks that match your change scope:

```bash
npm test
npm run test:e2e
npm run typecheck
npm run build
```

Notes:

- Repository tests use the PGlite-backed Postgres test utilities, not an in-memory repository.
- Documentation-only changes do not require new tests, but you should still run the relevant existing checks when practical.


## TypeScript strictness

The repo now enables `noUncheckedIndexedAccess` in addition to `strict`.

When touching boundary-heavy code, prefer patterns that preserve strictness benefits:

- Treat `config`, `credentials`, parsed JSON, and database rows as untrusted `Record<string, unknown>` inputs until narrowed.
- Prefer small helper accessors and type guards over `as string` / `as Record<string, unknown>` assertions at call sites.
- When reading keyed collections such as `tools[toolName]` or `sections[0]`, handle the `undefined` case explicitly instead of assuming the lookup succeeds.
- In tests, promote shared fixtures into named constants before spreading from indexed lookups.

Additional compiler options reviewed in this pass:

- `exactOptionalPropertyTypes`: valuable, but currently too much churn for request payload and connector record shapes that intentionally omit fields.
- `noPropertyAccessFromIndexSignature`: useful for future cleanup, but it would require broad bracket-notation migrations across config/JSON-heavy code.

If you introduce new modules that parse external payloads, default to explicit narrowing helpers first so those stricter options remain practical later.

## Development guidelines

- Keep dashboard route references aligned with the canonical top-level pages: `/integrations`, `/agent-connection`, `/profile`, `/case-by-case-approvals`, and `/admin-integrations`.
- Prefer focused changes over broad refactors.
- Update generated-doc helpers and route documentation together when agent/user/admin interfaces change.
- Store per-user OAuth credentials only in user-scoped integration connection records.
- For new provider work, start with [`.openhands/skills/adding-integrations/SKILL.md`](./.openhands/skills/adding-integrations/SKILL.md).

## Test design checklist

- Prefer semantic assertions over raw HTML, markdown, CSS, or OpenAPI string matching.
- Split large multi-purpose suites before adding substantial new coverage to them.
- Use builders/helpers for repeated integration, connector, API-key, and access-request fixtures.
- Prefer PGlite-backed repository/service coverage over deep internal mocking.
- Pair the public result with one meaningful side effect (persistence, visibility, logging, or auth outcome).
- Avoid giant `toEqual(...)` payloads for generated structures unless the exact formatting is the contract.

## Pull requests

- Reference the issue being fixed.
- Summarize the user-facing behavior or documentation change.
- Include the validation you ran.
- Keep PRs scoped to one problem when possible.
