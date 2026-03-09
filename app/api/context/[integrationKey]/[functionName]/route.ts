import { fromError, ok } from "@/src/lib/api";
import { extractContextApiKey } from "@/src/lib/context-api-auth";
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
        {
          ownerId: apiKeyRecord.ownerId,
        },
      ),
    );
  } catch (error) {
    return fromError(error);
  }
}
