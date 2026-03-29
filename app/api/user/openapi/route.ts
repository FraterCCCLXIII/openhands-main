import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";
import {
  authenticateUserApiRequest,
  fromUserApiError,
} from "@/src/lib/user-api-auth";
import { buildUserOpenApiDocument } from "@/src/lib/user-openapi";

export async function GET(request: Request) {
  try {
    const identity = await authenticateUserApiRequest(request);
    const service = getContextLayerService();
    const integrations = await service.listOwnerIntegrations(identity.ownerId);

    return ok(
      buildUserOpenApiDocument({
        baseUrl: new URL(request.url).origin,
        integrations,
        isAdmin: identity.isAdmin,
      }),
    );
  } catch (error) {
    return fromUserApiError(error);
  }
}
