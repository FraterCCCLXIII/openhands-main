import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function GET(request: Request) {
  try {
    await authenticateAdminApiRequest(request);
    const service = getContextLayerService();
    return ok(await service.listAccessRequests());
  } catch (error) {
    return fromAdminApiError(error);
  }
}
