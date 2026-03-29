import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { GET as getManagedConnectorsOpenApi } from "@/app/api/managed-connectors/openapi/route";

export async function GET(request: Request) {
  try {
    await authenticateAdminApiRequest(request);
    return getManagedConnectorsOpenApi(request);
  } catch (error) {
    return fromAdminApiError(error);
  }
}
