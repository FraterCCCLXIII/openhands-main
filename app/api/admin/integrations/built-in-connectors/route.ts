import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { getContextLayerRepository } from "@/src/lib/core/runtime";
import { listBuiltInConnectors } from "@/src/lib/integrations/discovery";

export async function GET(request: Request) {
  try {
    await authenticateAdminApiRequest(request);
    return ok(await listBuiltInConnectors(getContextLayerRepository()));
  } catch (error) {
    return fromAdminApiError(error);
  }
}
