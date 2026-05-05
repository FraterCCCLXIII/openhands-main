import { fromError, ok } from "@/src/lib/api";
import { auth } from "@/src/lib/auth";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { IntegrationsHubError } from "@/src/lib/core/errors";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import { managedConnectorUpsertSchema } from "@/src/lib/managed-connectors/api-schema";
import { hasPersistentIntegrationsHubStorage } from "@/src/lib/persistence";

export async function GET() {
  try {
    return ok(await getIntegrationsHubService().listManagedConnectors());
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!isAppAdminEmail(session?.user?.email ?? undefined)) {
      throw new IntegrationsHubError("Only app administrators can register managed connectors.", 403);
    }

    if (process.env.NODE_ENV !== "test" && !hasPersistentIntegrationsHubStorage()) {
      throw new IntegrationsHubError(
        "Managed connector registration requires POSTGRES_URL or DATABASE_URL. This deployment has no persistent database configured.",
        503,
      );
    }

    const payload = managedConnectorUpsertSchema.parse(await request.json());
    return ok(await getIntegrationsHubService().upsertManagedConnector(payload));
  } catch (error) {
    return fromError(error);
  }
}
