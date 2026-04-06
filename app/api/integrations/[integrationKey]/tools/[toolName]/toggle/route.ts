import { z } from "zod";

import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerService } from "@/src/lib/core/runtime";

const toggleSchema = z.object({ enabled: z.boolean() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ integrationKey: string; toolName: string }> },
) {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const payload = toggleSchema.parse(await request.json());
    const { integrationKey, toolName } = await params;
    const service = getContextLayerService();
    return ok(
      await service.setOwnerToolEnabled(
        ownerId,
        integrationKey,
        toolName,
        payload.enabled,
      ),
    );
  } catch (error) {
    return fromError(error);
  }
}
