import { fromError, ok } from "@/src/lib/api";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { integrationCreateSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { assertUserCanSaveIntegration } from "@/src/lib/integrations/user-connector-guardrails";
import { logRouteInfo, summarizeRouteError } from "@/src/lib/route-logging";
import { getOptionalTrimmedString } from "@/src/lib/type-utils";

export async function GET() {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const service = getContextLayerService();
    return ok(await service.listOwnerIntegrationsWithUsage(ownerId));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  let ownerId: string | null = null;
  let integrationKey: string | null = null;
  let managedConnectorSlug: string | null = null;

  try {
    ({ ownerId } = await getCurrentUserIdentity());
    const payload = integrationCreateSchema.parse(await request.json());
    integrationKey = payload.key;
    managedConnectorSlug =
      getOptionalTrimmedString(payload.config, "managedConnectorSlug") ?? null;

    logRouteInfo("/api/integrations", "create_requested", {
      ownerId,
      integrationKey,
      managedConnectorSlug,
      kind: payload.kind,
      provider: payload.provider,
      authStrategy: payload.authStrategy,
    });

    assertUserCanSaveIntegration(isAppAdminEmail(ownerId), payload);
    const service = getContextLayerService();
    const integration = await service.registerOwnerIntegration(ownerId, payload);

    logRouteInfo("/api/integrations", "create_succeeded", {
      ownerId,
      integrationKey: integration.key,
      managedConnectorSlug,
      toolCount: Object.keys(integration.tools).length,
    });

    return ok(integration);
  } catch (error) {
    logRouteInfo("/api/integrations", "create_failed", {
      ownerId,
      integrationKey,
      managedConnectorSlug,
      ...summarizeRouteError(error),
    });
    return fromError(error);
  }
}
