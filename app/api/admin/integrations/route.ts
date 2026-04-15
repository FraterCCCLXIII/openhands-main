import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ContextLayerError } from "@/src/lib/core/errors";

const DEPRECATED_ADMIN_INTEGRATIONS_MESSAGE =
  "Admin API keys can no longer manage self-scoped integrations. Use the user API key with /api/user/integrations instead.";

const throwDeprecatedAdminIntegrationsError = () => {
  throw new ContextLayerError(DEPRECATED_ADMIN_INTEGRATIONS_MESSAGE, 410);
};

export async function GET(request: Request) {
  try {
    await authenticateAdminApiRequest(request);
    throwDeprecatedAdminIntegrationsError();
  } catch (error) {
    return fromAdminApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await authenticateAdminApiRequest(request);
    throwDeprecatedAdminIntegrationsError();
  } catch (error) {
    return fromAdminApiError(error);
  }
}
