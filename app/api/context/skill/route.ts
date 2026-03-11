import { fromError } from "@/src/lib/api";
import { buildAgentSkillMarkdown } from "@/src/lib/agent-skill";
import { extractContextApiKey } from "@/src/lib/context-api-auth";
import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { getRequestOrigin } from "@/src/lib/request-context";

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

    if (!(await service.getStoredAgentApiKey(providedApiKey))) {
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

    const markdown = buildAgentSkillMarkdown({
      baseUrl: getRequestOrigin(request.headers),
      integrations: await service.listIntegrations(),
    });

    return new Response(markdown, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": 'attachment; filename="SKILL.md"',
        "Content-Type": "text/markdown; charset=utf-8",
      },
    });
  } catch (error) {
    return fromError(error);
  }
}
