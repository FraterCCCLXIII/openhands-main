import { fromError, ok } from "@/src/lib/api";
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
    const payload = managedConnectorUpsertSchema.parse(await request.json());
    return ok(await getContextLayerService().upsertManagedConnector(payload));
  } catch (error) {
    return fromError(error);
  }
}
