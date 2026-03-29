import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function GET(request: Request) {
  try {
    const { ownerId } = await authenticateAdminApiRequest(request);
    const service = getContextLayerService();
    return ok(await service.listIntegrationConnections(ownerId));
  } catch (error) {
    return fromAdminApiError(error);
  }
}
