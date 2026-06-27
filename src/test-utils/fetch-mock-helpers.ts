/**
 * Shared fetch-mock builders for component tests.
 *
 * Many component test files (especially `workspace.test.tsx`) repeat the
 * same "return standard JSON for these dashboard routes, throw for
 * unexpected fetches" pattern across many tests. This module exposes a
 * builder that handles the common routing logic while leaving an explicit
 * `routeHandler` escape hatch for scenario-specific responses.
 *
 * Tests should still keep narrowly-scoped fetchMock implementations when
 * they need to track call counts or simulate per-call behavior; this
 * builder is intended for the common shape where the dashboard simply
 * needs the four standard endpoints to resolve with predictable data.
 */
import { vi } from "vitest";

import type {
  AccessRequest,
  IntegrationSpec,
  ManagedConnectorOption,
  NotificationRecord,
} from "@/src/types/integrations-hub";

const jsonResponse = (payload: unknown): Response =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

/**
 * Per-test overrides for the dashboard fetch mock builder. Any field that
 * is omitted falls back to an empty array so the standard dashboard fetch
 * cycle resolves without errors.
 *
 * `integrations` accepts either a literal value or a thunk so tests that
 * need their integration list to evolve across calls (for example after a
 * PATCH/DELETE) can read the latest state on each fetch.
 *
 * `routeHandler` runs **before** the standard route fallbacks, which lets
 * a test intercept any of the standard endpoints (or add its own routes)
 * by returning a `Response`. Returning `null` / `undefined` means "fall
 * through to the standard handling", and any unmatched request still
 * throws so unexpected fetches stay loud.
 */
interface DashboardFetchMockOverrides {
  integrations?: IntegrationSpec[] | (() => IntegrationSpec[]);
  managedConnectors?: ManagedConnectorOption[];
  accessRequests?: AccessRequest[];
  notifications?: NotificationRecord[];
  routeHandler?: (
    url: string,
    method: string,
    init?: RequestInit,
  ) => Response | Promise<Response> | null | undefined;
}

/**
 * Build a vitest fetch mock that returns standard dashboard JSON for the
 * four common routes (`/api/integrations`, `/api/integrations/managed-connectors`,
 * `/api/case-by-case-approvals`, `/api/notifications`) and throws for any
 * unexpected request so tests can't silently drift into untested routes.
 */
export const createDashboardFetchMock = (
  overrides: DashboardFetchMockOverrides = {},
) =>
  vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = init?.method ?? "GET";

    if (overrides.routeHandler) {
      const handled = await overrides.routeHandler(url, method, init);
      if (handled) {
        return handled;
      }
    }

    if (url === "/api/integrations" && method === "GET") {
      const payload =
        typeof overrides.integrations === "function"
          ? overrides.integrations()
          : overrides.integrations ?? [];
      return jsonResponse(payload);
    }

    if (url === "/api/integrations/managed-connectors") {
      return jsonResponse(overrides.managedConnectors ?? []);
    }

    if (url === "/api/case-by-case-approvals" && method === "GET") {
      return jsonResponse(overrides.accessRequests ?? []);
    }

    if (url === "/api/notifications" && method === "GET") {
      return jsonResponse(overrides.notifications ?? []);
    }

    throw new Error(`Unexpected fetch: ${method} ${url}`);
  });
