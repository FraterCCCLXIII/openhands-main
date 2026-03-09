import { fromError, ok } from "@/src/lib/api";
import { listOAuthProviderCatalog } from "@/src/lib/integrations/oauth-provider-catalog";

export async function GET() {
  try {
    return ok(listOAuthProviderCatalog());
  } catch (error) {
    return fromError(error);
  }
}
