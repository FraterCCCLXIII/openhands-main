import { fromError, ok } from "@/src/lib/api";
import { auth } from "@/src/lib/auth";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { managedConnectorUpsertSchema } from "@/src/lib/managed-connectors/api-schema";

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

    const payload = managedConnectorUpsertSchema.parse(await request.json());
    return ok(await getContextLayerService().upsertManagedConnector(payload));
  } catch (error) {
    return fromError(error);
  }
}
