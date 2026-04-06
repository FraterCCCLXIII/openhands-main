import { z } from "zod";

import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";

const updateToolSchema = z.object({
  accessMode: z.enum(["enabled", "disabled", "approval_required"]),
});

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ integrationKey: string; toolName: string }> },
) {
  try {
    const { ownerId } = await authenticateAdminApiRequest(request);
    const payload = updateToolSchema.parse(await request.json());
    const { integrationKey, toolName } = await params;
    const service = getContextLayerService();

    return ok(
      await service.setOwnerToolAccessMode(
        ownerId,
        integrationKey,
        toolName,
        payload.accessMode,
      ),
    );
  } catch (error) {
    return fromAdminApiError(error);
  }
}
