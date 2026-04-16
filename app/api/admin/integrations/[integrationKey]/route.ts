import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ContextLayerError } from "@/src/lib/core/errors";

const DEPRECATED_ADMIN_INTEGRATION_DELETE_MESSAGE =
  "Admin API keys can no longer delete self-scoped integrations. Use the user API key with /api/user/integrations/{integrationKey} instead.";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ integrationKey: string }> },
) {
  try {
    await authenticateAdminApiRequest(request);
    await context.params;
    throw new ContextLayerError(DEPRECATED_ADMIN_INTEGRATION_DELETE_MESSAGE, 410);
  } catch (error) {
    return fromAdminApiError(error);
  }
}
