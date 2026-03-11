import { fromError, ok } from "@/src/lib/api";
import { auth } from "@/src/lib/auth";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { managedConnectorUpsertSchema } from "@/src/lib/managed-connectors/api-schema";
import { hasPersistentContextLayerStorage } from "@/src/lib/persistence";

export async function GET() {
  try {
    return ok(await getContextLayerService().listManagedConnectors());
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!isAppAdminEmail(session?.user?.email ?? undefined)) {
      throw new ContextLayerError("Only app administrators can register managed connectors.", 403);
    }

    if (process.env.NODE_ENV !== "test" && !hasPersistentContextLayerStorage()) {
      throw new ContextLayerError(
        "Managed connector registration requires POSTGRES_URL or DATABASE_URL. This deployment has no persistent database configured.",
        503,
      );
    }

    const payload = managedConnectorUpsertSchema.parse(await request.json());
    return ok(await getContextLayerService().upsertManagedConnector(payload));
  } catch (error) {
    return fromError(error);
  }
}
