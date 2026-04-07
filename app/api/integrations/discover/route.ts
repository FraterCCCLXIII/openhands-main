import { z } from "zod";

import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerRepository } from "@/src/lib/core/runtime";
import { discoverIntegration } from "@/src/lib/integrations/discovery";

const integrationDiscoverySchema = z.object({
  key: z.string().min(1),
  kind: z.enum(["mcp", "managed", "built_in"]),
  config: z.record(z.string(), z.unknown()).default({}),
  credentials: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: Request) {
  try {
    const payload = integrationDiscoverySchema.parse(await request.json());
    const normalizedPayload = {
      ...payload,
      kind: payload.kind === "built_in" ? "managed" : payload.kind,
      config:
        payload.kind === "built_in" &&
        typeof payload.config.managedConnectorSlug !== "string" &&
        typeof payload.config.builtInSlug === "string"
          ? {
              ...payload.config,
              managedConnectorSlug: payload.config.builtInSlug,
            }
          : payload.config,
    };
    const baseUrl = new URL(request.url).origin;
    const { ownerId } = await getCurrentUserIdentity();
    return ok(
      await discoverIntegration(normalizedPayload, {
        baseUrl,
        repository: getContextLayerRepository(),
        ownerId,
      }),
    );
  } catch (error) {
    return fromError(error);
  }
}
