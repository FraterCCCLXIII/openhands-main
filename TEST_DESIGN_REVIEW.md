# Test Design Review Pass

This document closes issue #123 by capturing a file-by-file test-design review of the current suite.

- Review date: 2026-04-06
- Files reviewed: 66 committed `*.test.ts` / `*.test.tsx` files
- Review lens: Dave Farley's properties of good tests (understandable, maintainable, repeatable, atomic, necessary, granular, fast, test-first)

## Overall readout

### What is already working well

- The critical backend paths already prefer real behavior over deep mocks: repository tests use PGlite, service tests exercise the real service layer, and route tests usually assert request/response contracts through the actual handlers.
- Auth, OpenAPI, MCP, OAuth, and connector-management code paths have meaningful happy-path plus permission-path coverage.
- Most small utility tests are fast, deterministic, and easy to understand.

### Highest-value design concerns

1. **Snapshot-in-disguise UI tests** — several page/component tests assert dozens of `toContain(...)` strings against one large HTML blob. They verify a lot of copy at once, but they are brittle and hide intent.
2. **Monolithic scenario files** — a few critical suites have grown into large multi-topic files. They still provide value, but they are harder to navigate and harder to extend without duplication.
3. **Fixture duplication** — connector, integration, and request fixtures are often inlined repeatedly instead of being built from shared factories.
4. **Full-object equality on generated output** — a few tests compare large generated payloads verbatim. Those read clearly today, but they will churn when formatting or non-critical metadata changes.
5. **Thin regression guards** — a handful of tiny tests are useful smoke checks, but they will need broader behavioral coverage if the underlying modules grow.

## Priority rewrite queue

1. `src/components/dashboard/workspace.test.tsx` — split by route/feature area and move shared render/fetch helpers into local test utilities.
2. `src/components/admin/integrations/provider-catalog.test.tsx` — convert repeated registration flows into data-driven cases plus payload-focused helpers.
3. `app/admin-integrations/page.test.tsx` — replace raw markup string matching with semantic DOM assertions for nav, admin/user cards, and unavailable-state rendering.
4. `src/lib/core/service.test.ts` — split into access evaluation, invocation side effects, key management, and managed-connector ceiling suites with shared builders.
5. `src/lib/db/e2e-repository.test.ts` — keep the real Postgres coverage, but replace repeated inline records with fixture builders to highlight the contract each test cares about.
6. `src/lib/e2e-integration.test.ts` — separate catalog behavior, connector-install flows, and API-key lifecycle flows so failures localize faster.
7. `src/lib/managed-connectors/openapi.test.ts` — replace one giant `toEqual` with focused assertions around filtering, parameter mapping, and content-type translation.
8. `src/lib/theme-regression.test.ts` — parse the CSS variables or computed token map instead of asserting raw file substrings.

## File-by-file review

Legend:
- **Excellent** — strong test design; only minor polish suggested.
- **Good** — solid value; keep, but tighten structure or helpers when touching the file next.
- **Fair** — worthwhile coverage, but design debt is noticeable and should be rewritten before adding much more to the file.

### Critical-path backend and end-to-end suites

- `src/lib/core/service.test.ts` — **Good**. Excellent behavioral coverage on the heart of the system, but 1,500+ lines and repeated inline fixtures make navigation and extension expensive; split by concern and introduce builders.
- `src/lib/db/e2e-repository.test.ts` — **Good**. Real-schema coverage is exactly what this layer needs; repeated record literals and long sequential sections should become factories plus smaller contract-focused blocks.
- `src/lib/e2e-integration.test.ts` — **Good**. Valuable end-to-end flow coverage with PGlite; scenario comments reveal setup complexity that should move into reusable helpers.
- `app/api/mcp/route.test.ts` — **Good**. Strong contract coverage across tool listing, approval gating, and schema publication; parsing the returned JSON text would be less brittle than substring checks.
- `app/api/context/openapi/route.test.ts` — **Good**. Covers the right visibility rules with a realistic seeded repository; extract seeding/builders so the intent of each case stands out faster.
- `app/api/context/skill/route.test.ts` — **Good**. Good end-to-end contract checks for generated `SKILL.md`; prefer section-level assertions over many text fragments as the document evolves.
- `src/lib/integrations/discovery.test.ts` — **Good**. Broad discovery coverage across connector types; split by discovery source and extract connector factories to reduce cognitive load.
- `src/lib/oauth/provider-resolver.test.ts` — **Good**. Important OAuth edge cases are covered with realistic data; request-body assertions could be extracted into small helpers for readability.
- `src/lib/mcp-client.test.ts` — **Excellent**. Focused, deterministic, and behavior-oriented around fallback and diagnostics.
- `src/lib/mcp/session-store.test.ts` — **Good**. Clear storage-behavior coverage; add a tiny helper for session setup if more cases are added.

### API route, auth, and protocol tests

- `app/api/add-connector/route.test.ts` — **Excellent**. Single behavior, clear persistence assertion, and meaningful side-effect verification.
- `app/api/admin/access-requests/[requestId]/approve/route.test.ts` — **Excellent**. Focused auth plus approval-path coverage; keep using real service setup.
- `app/api/admin/access-requests/[requestId]/reject/route.test.ts` — **Excellent**. Same strengths as the approve route; a shared access-request helper would trim duplication.
- `app/api/admin/integrations/[integrationKey]/tools/[toolName]/route.test.ts` — **Good**. Useful permission and mutation checks; next rewrite should name the persisted ceiling/owner outcome even more directly.
- `app/api/admin/key/route.test.ts` — **Good**. Good session-vs-admin behavior coverage; extract a small request helper to avoid repeated setup noise.
- `app/api/admin/managed-connectors/route.test.ts` — **Excellent**. Clear API-key auth contract plus list/store behavior.
- `app/api/admin/openapi/route.test.ts` — **Excellent**. Good contract-level assertions for bearer auth and allowlist behavior.
- `app/api/cron/expire-grants/route.test.ts` — **Excellent**. Small, focused, deterministic tests with clear security intent.
- `app/api/integrations/[integrationKey]/route.test.ts` — **Good**. Useful owner-scoped delete coverage, but thin; add unhappy-path cases before growing the route further.
- `app/api/integrations/disable-unused/route.test.ts` — **Good**. Covers the important tracked-usage cutoff behavior; add an explicit no-op case for untracked tools to document that policy.
- `app/api/integrations/route.test.ts` — **Excellent**. Clear owner/admin visibility behavior without over-asserting implementation details.
- `app/api/managed-connectors/[slug]/functions/route.test.ts` — **Good**. Valuable ceiling-preservation coverage; helper extraction would make the admin-vs-user contrast easier to scan.
- `app/api/managed-connectors/[slug]/route.test.ts` — **Excellent**. Focused authorization and deletion behavior.
- `app/api/managed-connectors/openapi/route.test.ts` — **Good**. Clear smoke test, but thin; expand if the endpoint shape becomes more dynamic.
- `app/api/managed-connectors/route.test.ts` — **Good**. Good registration and production-guard coverage; would benefit from a shared admin-session fixture.
- `app/api/oauth/[provider]/callback/route.test.ts` — **Good**. Important redirect-proxy behavior is covered; parsing the forwarded request parameters more semantically would reduce brittleness.
- `app/api/oauth/[provider]/start/route.test.ts` — **Good**. Good start-flow coverage with realistic redirect concerns; helper extraction would clarify the setup-vs-assert portions.
- `app/api/user/access-requests/[requestId]/approve/route.test.ts` — **Excellent**. Focused admin requirement and approval behavior.
- `app/api/user/integrations/[integrationKey]/tools/[toolName]/route.test.ts` — **Good**. Good owner-scoped mutation checks with revoked-key behavior; consider table-driven auth cases next.
- `app/api/user/key/route.test.ts` — **Good**. Useful session-based key lifecycle coverage; minor duplication with the admin-key suite suggests a shared helper.
- `app/api/user/openapi/route.test.ts` — **Excellent**. Strong contract assertions around admin-only paths and bearer challenge behavior.
- `src/lib/api.test.ts` — **Excellent**. Tight unit tests that assert the public contract and avoid implementation noise.
- `src/lib/auth-config.test.ts` — **Excellent**. Clear configuration-matrix coverage; if the matrix grows further, convert repeated setup into table-driven cases.
- `src/lib/context-api-auth.test.ts` — **Excellent**. Small and precise, with no unnecessary fixture overhead.
- `src/lib/user-api-auth.test.ts` — **Excellent**. Good auth and admin-gating coverage with real service key issuance.
- `src/lib/admin-routes.test.ts` — **Excellent**. Small, deterministic contract tests.
- `src/lib/request-context.test.ts` — **Excellent**. Fast, readable, and behavior-first.
- `src/lib/proxy.test.ts` — **Excellent**. Focused security behavior with minimal setup.
- `src/lib/credential-crypto.test.ts` — **Excellent**. Small but valuable contract tests around secret requirements.
- `src/lib/core/schema.test.ts` — **Good**. Useful defaulting check, but very thin; expand when the invocation schema changes again.
- `src/lib/adapters/http-adapter.test.ts` — **Good**. Strong multipart/binary-path behavior check; add an error-path or header-shape assertion if the adapter grows.
- `src/lib/adapters/mcp-adapter.test.ts` — **Excellent**. Focused behavior at the adapter boundary with minimal mocking.
- `src/lib/mcp/tool-input-schema.test.ts` — **Excellent**. Good contract-level assertions around merged schemas and reserved fields.
- `src/lib/openapi-documents.test.ts` — **Good**. Good top-level contract coverage; avoid expanding it into a giant path-by-path equality test.
- `src/lib/managed-connectors/openapi.test.ts` — **Fair**. Valuable generator coverage, but one giant equality assertion makes failures noisy and formatting-sensitive; split into filtering, parameter mapping, and content-type cases.
- `src/lib/db/postgres-repository.test.ts` — **Excellent**. Small, purposeful concurrency-focused tests that document behavior clearly.
- `src/lib/integrations/oauth-provider-catalog.test.ts` — **Excellent**. Clear catalog invariants without over-mocking.
- `src/lib/integrations/visible-integrations.test.ts` — **Good**. Nice focused smoke test, but thin if more visibility rules arrive.

### UI, rendering, and generated-text tests

- `app/admin-integrations/page.test.tsx` — **Fair**. High-value route coverage, but 50+ raw markup substring assertions make this file brittle and hard to diagnose; assert nav/card semantics instead of page copy exhaustively.
- `app/layout.test.ts` — **Excellent**. Very small metadata contract check with no extra ceremony.
- `app/page.test.tsx` — **Fair**. The intent is clear, but raw static-markup assertions couple the test tightly to copy and layout text; prefer DOM-level checks for the unavailable-state variants.
- `src/components/admin/integrations/catalog.test.tsx` — **Good**. Behavior-focused refresh test; next touch should extract fetch/render helpers.
- `src/components/admin/integrations/managed-connector-list.test.tsx` — **Good**. Covers important admin workflows, but the setup is repetitive and should move into local builders before the file grows further.
- `src/components/admin/integrations/provider-catalog.test.tsx` — **Fair**. Valuable provider-specific registration coverage, but the file is too large and copy-heavy; rewrite into data-driven provider cases plus request-payload helpers.
- `src/components/auth/github-sign-in-button.test.tsx` — **Good**. Small and clear, but only a smoke test today.
- `src/components/dashboard/utils.test.ts` — **Excellent**. Pure-function tests with readable input/output behavior.
- `src/components/dashboard/workspace.test.tsx` — **Fair**. Critical UI coverage, but the 1,800-line file mixes many concerns and leans on fetch-call and copy assertions; split by route and introduce dedicated render helpers.
- `src/components/integrations/wizard/connect-step.test.tsx` — **Good**. Good user-flow coverage; next cleanup should extract shared input helpers and reduce copy assertions.
- `src/components/integrations/wizard/utils.test.ts` — **Excellent**. Focused utility coverage with minimal noise.
- `src/components/integrations/wizard/wizard.test.tsx` — **Good**. Strong coverage of key onboarding flows, but it is becoming monolithic; split step-selection, discovery, and access-review concerns before adding much more.
- `src/components/providers.test.tsx` — **Excellent**. Small, behavior-oriented provider wrapping tests.
- `src/components/ui/button-cursor.test.tsx` — **Excellent**. Clear regression test with crisp scope.
- `src/components/ui/theme-primitives.test.tsx` — **Good**. Useful design-system guard, though still fairly string-oriented; keep it limited to the most important primitives.
- `src/lib/agent-connection.test.ts` — **Good**. Valuable example-generation coverage; generated-text assertions should stay focused on invariants, not every line.
- `src/lib/agent-skill.test.ts` — **Good**. Good enabled-tool filtering coverage, but it is still a generated-markdown string test; consider parsing sections or using smaller invariant helpers if the document grows.
- `src/lib/theme-regression.test.ts` — **Fair**. Useful palette smoke test, but raw file substring matching is fragile; parse variables or expose a token map helper instead.

## Reusable testing guidelines

1. **Prefer semantic assertions over raw text blobs.** When testing pages, generated markdown, CSS, or OpenAPI documents, assert the contract-level invariants that matter instead of every rendered string.
2. **Keep one test file focused on one subsystem.** If a file starts mixing unrelated routes, UI sections, or service responsibilities, split it before it becomes the only safe place to add new coverage.
3. **Use builders for integrations, connectors, access requests, and API keys.** Repeated inline literals hide intent and make change-heavy refactors noisy.
4. **Mock only at the true boundary.** Repository and service tests should continue using PGlite and real service logic; mock external HTTP/MCP boundaries, not internal orchestration.
5. **Assert one behavior plus one meaningful side effect.** For route and service tests, pair the public result with the persistence/logging/visibility effect that proves the flow actually happened.
6. **Avoid giant equality assertions for generated structures.** Large `toEqual(...)` payloads become snapshots without the tooling; split them into smaller contract assertions.
7. **Use table-driven cases when the setup is the same and only inputs vary.** This especially applies to auth/config matrix tests and provider-registration flows.
8. **Treat thin regression tests as smoke alarms, not complete specs.** Keep them small, but add deeper behavioral tests as soon as the underlying module grows.

## Suggested next steps

- Rewrite the eight files in the priority queue before adding substantial new coverage to those same areas.
- Introduce shared test builders for integrations/connectors/request records under the local test files or a small test-helper module.
- Keep this document as the baseline reference for future coverage work so new tests raise both coverage and design quality.

## Reference

- Dave Farley's properties of good tests: https://www.linkedin.com/pulse/tdd-properties-good-tests-dave-farley-iexge/
- Referenced review prompt: https://github.com/citypaul/.dotfiles/blob/main/claude/.claude/skills/test-design-reviewer/SKILL.md
