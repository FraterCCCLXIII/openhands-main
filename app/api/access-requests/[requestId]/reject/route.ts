import { fromError, ok } from "@/src/lib/api";
import { requireAppAdminSession } from "@/src/lib/app-admin-session";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const { ownerId } = await requireAppAdminSession();
    await request.json().catch(() => ({}));
    const { requestId } = await params;
    const service = getContextLayerService();
    return ok(await service.rejectAccessRequest(requestId, ownerId));
  } catch (error) {
    return fromError(error);
  }
}
