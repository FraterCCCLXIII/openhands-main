import { fromError, ok } from "@/src/lib/api";
import {
  getContextApiAuthStatus,
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
    const authStatus = getContextApiAuthStatus();

    if (!authStatus.configured) {
      throw new ContextLayerError(
        "Set CONTEXT_LAYER_API_KEY or CONTEXT_LAYER_API_KEYS before agents call /api/context.",
        500,
      );
    }

    if (!isContextApiKeyAuthorized(request.headers)) {
      return Response.json(
        {
          detail:
            "Provide a valid context-layer API key in the Authorization bearer header or X-API-Key.",
        },
        {
          status: 401,
          headers: { "WWW-Authenticate": BEARER_CHALLENGE },
        },
      );
    }

    const payload = contextInvokeSchema.parse(await request.json());
    const { integrationKey, functionName } = await params;
    const service = getContextLayerService();
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
