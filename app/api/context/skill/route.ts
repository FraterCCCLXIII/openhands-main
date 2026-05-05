import { fromError } from "@/src/lib/api";
import { buildAgentSkillMarkdown } from "@/src/lib/agent-skill";
import { extractContextApiKey } from "@/src/lib/context-api-auth";
import { IntegrationsHubError } from "@/src/lib/core/errors";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import { getRequestOrigin } from "@/src/lib/request-context";

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

    const agentApiKeyRecord = await service.getStoredAgentApiKey(providedApiKey);

    if (!agentApiKeyRecord) {
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

    const markdown = buildAgentSkillMarkdown({
      baseUrl: getRequestOrigin(request.headers),
      integrations: await service.listOwnerIntegrations(agentApiKeyRecord.ownerId),
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
