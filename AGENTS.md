# AGENTS.md

## Repository purpose
This repository contains a Next.js/TypeScript implementation of an agent context layer. It exposes a single agent-facing context endpoint, supports Composio-backed API connectors and MCP SDK-backed MCP servers, provides fine-grained agent-class permissions plus temporary approval grants, and ships with a Tailwind admin dashboard styled after the OpenHands KPI tracker.

## Common commands
- Install dependencies: `npm install`
- Run locally with auth bypass: `DISABLE_AUTH=true npm run dev`
- Run tests: `npm test`
- Typecheck: `npm run typecheck`
- Production build check: `npm run build`

## Architecture notes
- `app/` contains the App Router pages and API route handlers.
- `src/lib/core/service.ts` contains the main permissioning, approval, and invocation orchestration logic.
- `src/lib/adapters/composio-adapter.ts` uses `@composio/core` for SaaS/API tool execution.
- `src/lib/adapters/mcp-adapter.ts` uses `@modelcontextprotocol/sdk` to call remote MCP tools.
- `src/lib/db/postgres-repository.ts` uses Neon with `POSTGRES_URL` or `DATABASE_URL`; `src/lib/db/memory-repository.ts` is the local/test fallback.
- `src/lib/auth.ts` configures Auth.js for Google login only; `DISABLE_AUTH=true` bypasses interactive auth for local development.
- `src/components/admin/admin-dashboard.tsx` is the OpenHands-inspired Tailwind dashboard using TanStack Query + Zustand.
- `app/api/cron/expire-grants/route.ts` is intended for a Vercel cron job to purge expired temporary grants.
