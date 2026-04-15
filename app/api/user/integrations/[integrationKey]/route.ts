import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";
import {
  authenticateUserApiRequest,
  fromUserApiError,
} from "@/src/lib/user-api-auth";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ integrationKey: string }> },
) {
  try {
    const { ownerId } = await authenticateUserApiRequest(request);
    const { integrationKey } = await context.params;
    const service = getContextLayerService();
    return ok(await service.deleteOwnerIntegration(ownerId, integrationKey));
  } catch (error) {
    return fromUserApiError(error);
  }
}
