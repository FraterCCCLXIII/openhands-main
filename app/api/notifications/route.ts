import { getContextLayerService } from "@/src/lib/core/runtime";
import { fromError, ok } from "@/src/lib/api";

export async function GET() {
  try {
    const service = getContextLayerService();
    return ok(await service.listNotifications());
  } catch (error) {
    return fromError(error);
  }
}
