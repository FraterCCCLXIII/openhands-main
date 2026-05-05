import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { IntegrationsHubError } from "@/src/lib/core/errors";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import { managedConnectorUpsertSchema } from "@/src/lib/managed-connectors/api-schema";
import { hasPersistentIntegrationsHubStorage } from "@/src/lib/persistence";

export async function GET(request: Request) {
  try {
    await authenticateAdminApiRequest(request);
    return ok(await getIntegrationsHubService().listManagedConnectors());
  } catch (error) {
    return fromAdminApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await authenticateAdminApiRequest(request);

    if (process.env.NODE_ENV !== "test" && !hasPersistentIntegrationsHubStorage()) {
      throw new IntegrationsHubError(
        "Managed connector registration requires POSTGRES_URL or DATABASE_URL. This deployment has no persistent database configured.",
        503,
      );
    }

    const payload = managedConnectorUpsertSchema.parse(await request.json());
    return ok(await getIntegrationsHubService().upsertManagedConnector(payload));
  } catch (error) {
    return fromAdminApiError(error);
  }
}
