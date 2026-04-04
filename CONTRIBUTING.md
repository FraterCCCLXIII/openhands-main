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

## Development guidelines

- Keep dashboard route references aligned with the canonical top-level pages: `/integrations`, `/agent-connection`, `/profile`, `/case-by-case-approvals`, and `/admin-integrations`.
- Prefer focused changes over broad refactors.
- Update generated-doc helpers and route documentation together when agent/user/admin interfaces change.
- Store per-user OAuth credentials only in user-scoped integration connection records.
- For new provider work, start with [`.openhands/skills/adding-integrations/README.md`](./.openhands/skills/adding-integrations/README.md) and the companion [`SKILL.md`](./.openhands/skills/adding-integrations/SKILL.md).

## Pull requests

- Reference the issue being fixed.
- Summarize the user-facing behavior or documentation change.
- Include the validation you ran.
- Keep PRs scoped to one problem when possible.
