import { z } from "zod";

import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";

const updateFunctionSchema = z.object({
  accessMode: z.enum(["enabled", "disabled", "approval_required"]),
});

export async function PATCH(
  request: Request,
  {
    params,
  }: { params: Promise<{ integrationKey: string; functionName: string }> },
) {
  try {
    const { ownerId } = await authenticateAdminApiRequest(request);
    const payload = updateFunctionSchema.parse(await request.json());
    const { integrationKey, functionName } = await params;
    const service = getContextLayerService();

    return ok(
      await service.setOwnerFunctionAccessMode(
        ownerId,
        integrationKey,
        functionName,
        payload.accessMode,
      ),
    );
  } catch (error) {
    return fromAdminApiError(error);
  }
}
