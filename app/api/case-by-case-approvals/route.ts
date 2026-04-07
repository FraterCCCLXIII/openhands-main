import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function GET() {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const service = getContextLayerService();
    return ok(await service.listOwnerAccessRequests(ownerId));
  } catch (error) {
    return fromError(error);
  }
}
