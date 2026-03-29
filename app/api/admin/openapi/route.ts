import { ok } from "@/src/lib/api";
import { authenticateAdminApiRequest, fromAdminApiError } from "@/src/lib/admin-api-auth";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { buildAdminOpenApiDocument } from "@/src/lib/admin-openapi";

export async function GET(request: Request) {
  try {
    const identity = await authenticateAdminApiRequest(request);
    const service = getContextLayerService();
    const integrations = await service.listOwnerIntegrations(identity.ownerId);

    return ok(
      buildAdminOpenApiDocument({
        baseUrl: new URL(request.url).origin,
        integrations,
      }),
    );
  } catch (error) {
    return fromAdminApiError(error);
  }
}
