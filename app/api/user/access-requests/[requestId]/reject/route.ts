import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";
import {
  authenticateUserApiRequest,
  fromUserApiError,
} from "@/src/lib/user-api-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const { ownerId } = await authenticateUserApiRequest(request, {
      requireAdmin: true,
    });
    const { requestId } = await params;
    const service = getContextLayerService();

    return ok(await service.rejectAccessRequest(requestId, ownerId));
  } catch (error) {
    return fromUserApiError(error);
  }
}
