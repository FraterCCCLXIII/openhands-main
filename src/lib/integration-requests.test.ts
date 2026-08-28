import { describe, expect, it } from "vitest";

import {
  adminIntegrationsHrefForRequest,
  catalogSlugForAddModal,
  isPendingIntegrationRequest,
  isRequestAlreadyRegistered,
  shouldOpenCatalogAddModal,
} from "@/src/lib/integration-requests";
import type { IntegrationRequest } from "@/src/types/integrations-hub";

const request = (
  overrides: Partial<IntegrationRequest> = {},
): IntegrationRequest => ({
  id: "req-1",
  source: "catalog",
  slug: "asana",
  name: "Asana",
  requestedBy: "user@example.com",
  createdAt: "2026-08-27T00:00:00.000Z",
  ...overrides,
});

describe("isPendingIntegrationRequest", () => {
  it("treats missing status as pending", () => {
    expect(isPendingIntegrationRequest(request())).toBe(true);
    expect(isPendingIntegrationRequest(request({ status: "added" }))).toBe(false);
  });
});

describe("adminIntegrationsHrefForRequest", () => {
  it("deep-links catalog slugs and falls back for custom requests", () => {
    expect(adminIntegrationsHrefForRequest(request())).toBe(
      "/admin-integrations?managedConnector=asana",
    );
    expect(
      adminIntegrationsHrefForRequest(
        request({ source: "custom", slug: "internal-wiki", name: "Internal Wiki" }),
      ),
    ).toBe("/admin-integrations");
  });
});

describe("shouldOpenCatalogAddModal", () => {
  it("opens the catalog modal only for known catalog slugs", () => {
    expect(catalogSlugForAddModal(request())).toBe("asana");
    expect(
      shouldOpenCatalogAddModal(request(), [{ slug: "asana" }, { slug: "linear" }]),
    ).toBe(true);
    expect(shouldOpenCatalogAddModal(request(), [{ slug: "linear" }])).toBe(false);
    expect(
      shouldOpenCatalogAddModal(
        request({ source: "custom", name: "Internal Wiki" }),
        [{ slug: "asana" }],
      ),
    ).toBe(false);
  });
});

describe("isRequestAlreadyRegistered", () => {
  it("is true when the catalog slug already has a managed connector", () => {
    expect(isRequestAlreadyRegistered(request(), [{ slug: "asana" }])).toBe(true);
    expect(isRequestAlreadyRegistered(request(), [{ slug: "linear" }])).toBe(false);
    expect(
      isRequestAlreadyRegistered(
        request({ source: "custom", name: "Internal Wiki" }),
        [{ slug: "internal-wiki" }],
      ),
    ).toBe(false);
  });
});
