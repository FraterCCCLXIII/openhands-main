import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    await request.json().catch(() => ({}));
    const { requestId } = await params;
    const service = getContextLayerService();
    return ok(await service.rejectOwnerAccessRequest(ownerId, requestId, ownerId));
  } catch (error) {
    return fromError(error);
  }
}
