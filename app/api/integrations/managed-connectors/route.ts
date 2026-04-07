import { fromError, ok } from "@/src/lib/api";
import { getContextLayerRepository } from "@/src/lib/core/runtime";
import { listManagedConnectorOptions } from "@/src/lib/integrations/discovery";

export async function GET() {
  try {
    return ok(await listManagedConnectorOptions(getContextLayerRepository()));
  } catch (error) {
    return fromError(error);
  }
}
