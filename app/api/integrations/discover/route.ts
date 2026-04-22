import { z } from "zod";

import { fromError, ok } from "@/src/lib/api";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerRepository } from "@/src/lib/core/runtime";
import { discoverIntegration } from "@/src/lib/integrations/discovery";
import { assertUserCanDiscoverIntegration } from "@/src/lib/integrations/user-connector-guardrails";

const integrationDiscoverySchema = z.object({
  key: z.string().min(1),
  kind: z.enum(["mcp", "managed"]),
  config: z.record(z.string(), z.unknown()).default({}),
  credentials: z.record(z.string(), z.unknown()).default({}),
});

export async function POST(request: Request) {
  try {
    const payload = integrationDiscoverySchema.parse(await request.json());
    const baseUrl = new URL(request.url).origin;
    const { ownerId } = await getCurrentUserIdentity();
    assertUserCanDiscoverIntegration(isAppAdminEmail(ownerId), payload);
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
