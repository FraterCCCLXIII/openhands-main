import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { managedConnectorUpsertSchema } from "@/src/lib/managed-connectors/api-schema";
import { hasPersistentContextLayerStorage } from "@/src/lib/persistence";

export async function GET(request: Request) {
  try {
    await authenticateAdminApiRequest(request);
    return ok(await getContextLayerService().listManagedConnectors());
  } catch (error) {
    return fromAdminApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await authenticateAdminApiRequest(request);

    if (process.env.NODE_ENV !== "test" && !hasPersistentContextLayerStorage()) {
      throw new ContextLayerError(
        "Managed connector registration requires POSTGRES_URL or DATABASE_URL. This deployment has no persistent database configured.",
        503,
      );
    }

    const payload = managedConnectorUpsertSchema.parse(await request.json());
    return ok(await getContextLayerService().upsertManagedConnector(payload));
  } catch (error) {
    return fromAdminApiError(error);
  }
}
