import { fromError, ok } from "@/src/lib/api";
import { extractContextApiKey } from "@/src/lib/context-api-auth";
import { buildContextOpenApiDocument } from "@/src/lib/context-openapi";
import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { filterIntegrationsVisibleToOwner } from "@/src/lib/integrations/visible-integrations";

const BEARER_CHALLENGE = 'Bearer realm="agent-context-layer"';

export async function GET(request: Request) {
  try {
    const service = getContextLayerService();
    const providedApiKey = extractContextApiKey(request.headers);
    const hasStoredAgentApiKeys = await service.hasStoredAgentApiKeys();

    if (!hasStoredAgentApiKeys) {
      throw new ContextLayerError(
        "Open the dashboard once to provision a personal context-layer API key before agents call /api/context.",
        503,
      );
    }

    const apiKeyRecord = await service.getStoredAgentApiKey(providedApiKey);

    if (!apiKeyRecord) {
      return Response.json(
        {
          detail:
            "Provide a valid personal context-layer API key in the Authorization bearer header or X-API-Key.",
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
