import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { listOAuthProviderCatalog } from "@/src/lib/integrations/oauth-provider-catalog";

export async function GET(request: Request) {
  try {
    await authenticateAdminApiRequest(request);
    return ok(listOAuthProviderCatalog());
  } catch (error) {
    return fromAdminApiError(error);
  }
}
