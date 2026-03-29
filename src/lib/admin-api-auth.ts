import { isAppAdminEmail } from "@/src/lib/app-admins";
import { fromError } from "@/src/lib/api";
import { extractContextApiKey } from "@/src/lib/context-api-auth";
import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";

export const ADMIN_API_BEARER_CHALLENGE = 'Bearer realm="context-layer-admin-api"';
export const ADMIN_API_UNAUTHORIZED_DETAIL =
  "Provide a valid admin API key in the Authorization bearer header or X-API-Key.";
export const ADMIN_API_FORBIDDEN_DETAIL =
  "This endpoint requires an active admin API key for an allowlisted admin user.";

export interface AdminApiRequestIdentity {
  ownerId: string;
  email: string;
  isAdmin: true;
}

export const authenticateAdminApiRequest = async (
  request: Request,
): Promise<AdminApiRequestIdentity> => {
  const apiKey = extractContextApiKey(request.headers);
  const service = getContextLayerService();
  const apiKeyRecord = await service.getStoredAdminApiKey(apiKey);

  if (!apiKeyRecord) {
    throw new ContextLayerError(ADMIN_API_UNAUTHORIZED_DETAIL, 401);
  }

  if (!isAppAdminEmail(apiKeyRecord.ownerId)) {
    throw new ContextLayerError(ADMIN_API_FORBIDDEN_DETAIL, 403);
  }

  return {
    ownerId: apiKeyRecord.ownerId,
    email: apiKeyRecord.ownerId,
    isAdmin: true,
  };
};

export const fromAdminApiError = async (error: unknown) => {
  if (error instanceof ContextLayerError && error.statusCode === 401) {
    return Response.json(
      { detail: error.message },
      {
        status: 401,
        headers: { "WWW-Authenticate": ADMIN_API_BEARER_CHALLENGE },
      },
    );
  }

  return fromError(error);
};
