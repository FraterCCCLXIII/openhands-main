import type { IntegrationRequest } from "@/src/types/integrations-hub";

export const ADMIN_INTEGRATION_REQUESTS_QUERY_KEY = [
  "admin-integration-requests",
] as const;

export function isPendingIntegrationRequest(request: IntegrationRequest): boolean {
  return (request.status ?? "pending") === "pending";
}

export function adminIntegrationsHrefForRequest(request: IntegrationRequest): string {
  const slug = catalogSlugForAddModal(request);
  if (slug) {
    return `/admin-integrations?managedConnector=${encodeURIComponent(slug)}`;
  }
  return "/admin-integrations";
}

export function catalogSlugForAddModal(request: IntegrationRequest): string | null {
  if (request.source !== "catalog") {
    return null;
  }
  const slug = request.slug?.trim();
  return slug || null;
}

export function shouldOpenCatalogAddModal(
  request: IntegrationRequest,
  catalog: ReadonlyArray<{ slug: string }>,
): boolean {
  const slug = catalogSlugForAddModal(request);
  if (!slug) {
    return false;
  }
  return catalog.some((entry) => entry.slug === slug);
}

export function isRequestAlreadyRegistered(
  request: IntegrationRequest,
  managedConnectors: ReadonlyArray<{ slug: string }>,
): boolean {
  const slug = catalogSlugForAddModal(request);
  if (!slug) {
    return false;
  }
  return managedConnectors.some((connector) => connector.slug === slug);
}
