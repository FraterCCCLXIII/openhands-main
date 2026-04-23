import { z } from "zod";

import { fromError, ok } from "@/src/lib/api";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerRepository } from "@/src/lib/core/runtime";
import { discoverIntegration } from "@/src/lib/integrations/discovery";
import { assertUserCanDiscoverIntegration } from "@/src/lib/integrations/user-connector-guardrails";
import { logRouteInfo, summarizeRouteError } from "@/src/lib/route-logging";
import { getOptionalTrimmedString } from "@/src/lib/type-utils";

const integrationDiscoverySchema = z.object({
  key: z.string().min(1),
  kind: z.enum(["mcp", "managed"]),
  config: z.record(z.string(), z.unknown()).default({}),
  credentials: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: Request) {
  let ownerId: string | null = null;
  let integrationKey: string | null = null;
  let kind: "mcp" | "managed" | null = null;
  let managedConnectorSlug: string | null = null;

  try {
    const payload = integrationDiscoverySchema.parse(await request.json());
    const baseUrl = new URL(request.url).origin;
    ({ ownerId } = await getCurrentUserIdentity());
    integrationKey = payload.key;
    kind = payload.kind;
    managedConnectorSlug =
      getOptionalTrimmedString(payload.config, "managedConnectorSlug") ?? null;

    logRouteInfo("/api/integrations/discover", "discover_requested", {
      ownerId,
      integrationKey,
      kind,
      managedConnectorSlug,
      hasCredentials: Object.keys(payload.credentials).length > 0,
    });

    assertUserCanDiscoverIntegration(isAppAdminEmail(ownerId), payload);
    const discovery = await discoverIntegration(payload, {
      baseUrl,
      repository: getContextLayerRepository(),
      ownerId,
    });

    logRouteInfo("/api/integrations/discover", "discover_succeeded", {
      ownerId,
      integrationKey,
      kind,
      managedConnectorSlug,
      provider: discovery.provider,
      authStrategy: discovery.authStrategy,
      toolCount: Object.keys(discovery.tools).length,
    });

    return ok(discovery);
  } catch (error) {
    logRouteInfo("/api/integrations/discover", "discover_failed", {
      ownerId,
      integrationKey,
      kind,
      managedConnectorSlug,
      ...summarizeRouteError(error),
    });
    return fromError(error);
  }
}
