import { isAppAdminEmail } from "@/src/lib/app-admins";
import { fromError } from "@/src/lib/api";
import { extractContextApiKey } from "@/src/lib/context-api-auth";
import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";

export const USER_API_BEARER_CHALLENGE = 'Bearer realm="context-layer-user-api"';
export const USER_API_UNAUTHORIZED_DETAIL =
  "Provide a valid user API key in the Authorization bearer header or X-API-Key.";
export const USER_API_ADMIN_REQUIRED_DETAIL =
  "This endpoint requires an admin user API key.";

export interface UserApiRequestIdentity {
  ownerId: string;
  email: string;
  isAdmin: boolean;
}

export const authenticateUserApiRequest = async (
  request: Request,
  options: { requireAdmin?: boolean } = {},
): Promise<UserApiRequestIdentity> => {
  const apiKey = extractContextApiKey(request.headers);
  const service = getContextLayerService();
  const apiKeyRecord = await service.getStoredUserApiKey(apiKey);

  if (!apiKeyRecord) {
    throw new ContextLayerError(USER_API_UNAUTHORIZED_DETAIL, 401);
  }

  const isAdmin = isAppAdminEmail(apiKeyRecord.ownerId);
  if (options.requireAdmin && !isAdmin) {
    throw new ContextLayerError(USER_API_ADMIN_REQUIRED_DETAIL, 403);
  }

  return {
    ownerId: apiKeyRecord.ownerId,
    email: apiKeyRecord.ownerId,
    isAdmin,
  };
};

export const fromUserApiError = async (error: unknown) => {
  if (error instanceof ContextLayerError && error.statusCode === 401) {
    return Response.json(
      { detail: error.message },
      {
        status: 401,
        headers: { "WWW-Authenticate": USER_API_BEARER_CHALLENGE },
      },
    );
  }

  return fromError(error);
};
