import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ integrationKey: string }> },
) {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const { integrationKey } = await context.params;
    const service = getContextLayerService();
    return ok(await service.deleteOwnerIntegration(ownerId, integrationKey));
  } catch (error) {
    return fromError(error);
  }
}
