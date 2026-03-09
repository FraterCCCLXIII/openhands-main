import { fromError, ok } from "@/src/lib/api";
import {
  extractContextApiKey,
  getContextApiKeys,
  isContextApiKeyAuthorized,
} from "@/src/lib/context-api-auth";
import { ContextLayerError } from "@/src/lib/core/errors";
import { contextInvokeSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";

const BEARER_CHALLENGE = 'Bearer realm="agent-context-layer"';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ integrationKey: string; functionName: string }> },
) {
  try {
    const service = getContextLayerService();
    const providedApiKey = extractContextApiKey(request.headers);
    const hasConfiguredContextApiKeys =
      getContextApiKeys().length > 0 || (await service.hasStoredAgentApiKeys());

    if (!hasConfiguredContextApiKeys) {
      throw new ContextLayerError(
        "Open the dashboard once to provision a personal context-layer API key, or set CONTEXT_LAYER_API_KEY / CONTEXT_LAYER_API_KEYS for a shared key.",
        500,
      );
    }

    const authorized =
      isContextApiKeyAuthorized(request.headers) ||
      (await service.isStoredAgentApiKeyAuthorized(providedApiKey));

    if (!authorized) {
      return Response.json(
        {
          detail:
            "Provide a valid personal or shared context-layer API key in the Authorization bearer header or X-API-Key.",
        },
        {
          status: 401,
          headers: { "WWW-Authenticate": BEARER_CHALLENGE },
        },
      );
    }

    const payload = contextInvokeSchema.parse(await request.json());
    const { integrationKey, functionName } = await params;
    return ok(
      await service.invokeContext(
        payload.agentId,
        payload.agentClass,
        integrationKey,
        functionName,
        payload.payload,
        payload.scopes,
      ),
    );
  } catch (error) {
    return fromError(error);
  }
}
