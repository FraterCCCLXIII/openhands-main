import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { integrationCreateSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function GET(request: Request) {
  try {
    const { ownerId } = await authenticateAdminApiRequest(request);
    const service = getContextLayerService();
    return ok(await service.listOwnerIntegrations(ownerId));
  } catch (error) {
    return fromAdminApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { ownerId } = await authenticateAdminApiRequest(request);
    const payload = integrationCreateSchema.parse(await request.json());
    const service = getContextLayerService();
    return ok(await service.registerOwnerIntegration(ownerId, payload));
  } catch (error) {
    return fromAdminApiError(error);
  }
}
