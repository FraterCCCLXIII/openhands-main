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

Mutation testing for new code:

```bash
npm run test:mutation -- src/path/to/new-file.ts
```

For exploratory full-repo runs:

```bash
npm run test:mutation:all
```

Notes:

- Repository tests use the PGlite-backed Postgres test utilities, not an in-memory repository.
- `npm run test:mutation` is a recurring manual review step for newly added code, not a CI gate. It infers the matching Vitest file when the test lives beside the source file (for example `src/example.ts` → `src/example.test.ts`) and writes an HTML report to `reports/mutation/mutation.html`.
- Use `--testFile <path>` when a new file's tests live elsewhere, and use `npm run test:mutation:all` only for exploratory broad runs because it soft-fails the score threshold and can take much longer.
- If a targeted mutation run reports surviving mutants, capture them in the PR or issue you are working on and use them to drive follow-up test hardening before merging.
- Documentation-only changes do not require new tests, but you should still run the relevant existing checks when practical.

## Development guidelines

- Keep dashboard route references aligned with the canonical top-level pages: `/integrations`, `/agent-connection`, `/profile`, `/case-by-case-approvals`, and `/admin-integrations`.
- Prefer focused changes over broad refactors.
- Update generated-doc helpers and route documentation together when agent/user/admin interfaces change.
- Store per-user OAuth credentials only in user-scoped integration connection records.
- For new provider work, start with [`.openhands/skills/adding-integrations/SKILL.md`](./.openhands/skills/adding-integrations/SKILL.md).

## Pull requests

- Reference the issue being fixed.
- Summarize the user-facing behavior or documentation change.
- Include the validation you ran.
- Keep PRs scoped to one problem when possible.
