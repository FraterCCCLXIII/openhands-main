import { fromError, ok } from "@/src/lib/api";
import { listBuiltInConnectors } from "@/src/lib/integrations/built-in-connectors";

export async function GET() {
  try {
    return ok(await listBuiltInConnectors());
  } catch (error) {
    return fromError(error);
  }
}
