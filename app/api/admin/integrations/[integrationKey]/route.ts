import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ integrationKey: string }> },
) {
  try {
    const { ownerId } = await authenticateAdminApiRequest(request);
    const { integrationKey } = await context.params;
    const service = getContextLayerService();
    return ok(await service.deleteOwnerIntegration(ownerId, integrationKey));
  } catch (error) {
    return fromAdminApiError(error);
  }
}
