import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ContextLayerError } from "@/src/lib/core/errors";

const DEPRECATED_ADMIN_CONNECTIONS_MESSAGE =
  "Admin API keys can no longer read self-scoped OAuth connections. Use the user API key with /api/user/connections instead.";

export async function GET(request: Request) {
  try {
    await authenticateAdminApiRequest(request);
    throw new ContextLayerError(DEPRECATED_ADMIN_CONNECTIONS_MESSAGE, 410);
  } catch (error) {
    return fromAdminApiError(error);
  }
}
