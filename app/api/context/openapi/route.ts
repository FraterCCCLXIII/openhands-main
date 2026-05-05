import { fromError, ok } from "@/src/lib/api";
import { extractContextApiKey } from "@/src/lib/context-api-auth";
import { buildContextOpenApiDocument } from "@/src/lib/context-openapi";
import { IntegrationsHubError } from "@/src/lib/core/errors";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import { filterIntegrationsVisibleToOwner } from "@/src/lib/integrations/visible-integrations";

const BEARER_CHALLENGE = 'Bearer realm="agent-integrations-hub"';

export async function GET(request: Request) {
  try {
    const service = getIntegrationsHubService();
    const providedApiKey = extractContextApiKey(request.headers);
    const hasStoredAgentApiKeys = await service.hasStoredAgentApiKeys();

    if (!hasStoredAgentApiKeys) {
      throw new IntegrationsHubError(
        "Open the dashboard once to provision a personal integrations-hub API key before agents call /api/context.",
        503,
      );
    }

    const apiKeyRecord = await service.getStoredAgentApiKey(providedApiKey);

    if (!apiKeyRecord) {
      return Response.json(
        {
          detail:
            "Provide a valid personal integrations-hub API key in the Authorization bearer header or X-API-Key.",
        },
        {
          status: 401,
          headers: { "WWW-Authenticate": BEARER_CHALLENGE },
        },
      );
    }

    const [integrations, connections] = await Promise.all([
      service.listOwnerIntegrations(apiKeyRecord.ownerId),
      service.listIntegrationConnections(apiKeyRecord.ownerId),
    ]);

    return ok(
      buildContextOpenApiDocument({
        baseUrl: new URL(request.url).origin,
        integrations: filterIntegrationsVisibleToOwner(integrations, connections),
      }),
    );
  } catch (error) {
    return fromError(error);
  }
}
