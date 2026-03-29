import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    const identity = await authenticateAdminApiRequest(request);
    const service = getContextLayerService();
    const { requestId } = await params;

    return ok(await service.rejectAccessRequest(requestId, identity.email));
  } catch (error) {
    return fromAdminApiError(error);
  }
}
