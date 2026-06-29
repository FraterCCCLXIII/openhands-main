import { UX_REVIEW_ADMIN_KEY, UX_REVIEW_AGENT_KEY, UX_REVIEW_USER_KEY, uxReviewFixtures } from "@/src/fixtures/ux-review/dashboard-fixtures";

const normalizePath = (input: RequestInfo): { pathname: string; method: string } => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const parsed = new URL(url, "http://ux-review.local");
  return {
    pathname: parsed.pathname,
    method: "GET",
  };
};

const successPayload = (payload: unknown) => payload;

/** Resolve a dashboard API request to static UX review fixture data. */
export const resolveUxReviewFixture = (
  input: RequestInfo,
  init?: RequestInit,
): unknown => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const parsed = new URL(url, "http://ux-review.local");
  const pathname = parsed.pathname;
  const method = (init?.method ?? "GET").toUpperCase();
  const fixtures = uxReviewFixtures;

  if (pathname === "/api/integrations" && method === "GET") {
    return successPayload(fixtures.integrations);
  }

  if (pathname === "/api/case-by-case-approvals" && method === "GET") {
    return successPayload(fixtures.accessRequests);
  }

  if (pathname === "/api/permission-profiles" && method === "GET") {
    return successPayload(fixtures.permissionProfiles);
  }

  if (pathname === "/api/integrations/managed-connectors" && method === "GET") {
    return successPayload(fixtures.managedConnectors);
  }

  if (
    (pathname === "/api/integrations/oauth-provider-catalog" ||
      pathname === "/api/integrations/catalog") &&
    method === "GET"
  ) {
    return successPayload(fixtures.providerCatalog);
  }

  if (pathname === "/api/auth/config" && method === "GET") {
    return successPayload({ posthogClientKey: null });
  }

  if (pathname === "/api/admin/managed-connectors" && method === "GET") {
    return successPayload(fixtures.adminManagedConnectors);
  }

  if (pathname === "/api/admin/overview" && method === "GET") {
    return successPayload(fixtures.adminOverview);
  }

  if (pathname === "/api/oauth/connections" && method === "GET") {
    return successPayload(fixtures.oauthConnections);
  }

  if (pathname === "/api/user/agent-key" && method === "GET") {
    return successPayload({ apiKey: UX_REVIEW_AGENT_KEY });
  }

  if (pathname === "/api/user/agent-key" && method === "POST") {
    return successPayload({ apiKey: UX_REVIEW_AGENT_KEY });
  }

  if (pathname === "/api/user/key" && method === "GET") {
    return successPayload({
      hasKey: true,
      key: fixtures.userKeyStatus,
      apiKey: null,
    });
  }

  if (pathname === "/api/user/key" && method === "POST") {
    return successPayload({
      hasKey: true,
      key: fixtures.userKeyStatus,
      apiKey: UX_REVIEW_USER_KEY,
    });
  }

  if (pathname === "/api/admin/key" && method === "GET") {
    return successPayload({
      hasKey: true,
      key: fixtures.adminKeyStatus,
      apiKey: null,
    });
  }

  if (pathname === "/api/admin/key" && method === "POST") {
    return successPayload({
      hasKey: true,
      key: fixtures.adminKeyStatus,
      apiKey: UX_REVIEW_ADMIN_KEY,
    });
  }

  if (pathname === "/api/integrations/discover" && method === "POST") {
    return successPayload(fixtures.discovery);
  }

  if (pathname === "/api/integrations/disable-unused" && method === "POST") {
    return successPayload({
      disabledTools: 2,
      skippedTools: 1,
      integrationKeys: ["github"],
    });
  }

  if (pathname.startsWith("/api/permission-profiles/") && pathname.endsWith("/agent-key")) {
    return successPayload({ apiKey: "cla_demo_profile_research_key" });
  }

  if (pathname.startsWith("/api/case-by-case-approvals/") && method === "POST") {
    return successPayload({ ok: true });
  }

  if (pathname.startsWith("/api/integrations/") && method === "POST") {
    return successPayload({ ok: true });
  }

  if (pathname.startsWith("/api/integrations/") && (method === "PATCH" || method === "DELETE")) {
    return successPayload({ ok: true });
  }

  if (pathname === "/api/integrations" && method === "POST") {
    return successPayload({ ok: true });
  }

  if (pathname.startsWith("/api/permission-profiles")) {
    return successPayload({ ok: true });
  }

  if (pathname.startsWith("/api/managed-connectors")) {
    return successPayload({ ok: true });
  }

  if (pathname.startsWith("/api/notifications")) {
    return successPayload([]);
  }

  console.warn(`[UX review mode] Unhandled ${method} ${pathname}; returning empty success payload.`);
  return successPayload({});
};

export const getUxReviewPath = (input: RequestInfo): string => normalizePath(input).pathname;
