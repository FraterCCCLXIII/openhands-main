import { z } from "zod";

import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerRepository } from "@/src/lib/core/runtime";
import { discoverIntegration } from "@/src/lib/integrations/discovery";

const integrationDiscoverySchema = z.object({
  key: z.string().min(1),
  kind: z.enum(["mcp", "built_in"]),
  config: z.record(z.string(), z.unknown()).default({}),
  credentials: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: Request) {
  try {
    const payload = integrationDiscoverySchema.parse(await request.json());
    const baseUrl = new URL(request.url).origin;
    const { ownerId } = await getCurrentUserIdentity();
    return ok(
      await discoverIntegration(payload, {
        baseUrl,
        repository: getContextLayerRepository(),
        ownerId,
      }),
    );
  } catch (error) {
    return fromError(error);
  }
}
