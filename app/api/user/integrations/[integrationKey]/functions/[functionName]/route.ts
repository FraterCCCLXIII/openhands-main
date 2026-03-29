import { z } from "zod";

import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";
import {
  authenticateUserApiRequest,
  fromUserApiError,
} from "@/src/lib/user-api-auth";

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
    const { ownerId } = await authenticateUserApiRequest(request);
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
    return fromUserApiError(error);
  }
}
