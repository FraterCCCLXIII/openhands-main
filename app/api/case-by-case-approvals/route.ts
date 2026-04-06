import { fromError, ok } from "@/src/lib/api";
import { requireAppAdminSession } from "@/src/lib/app-admin-session";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function GET() {
  try {
    await requireAppAdminSession();
    const service = getContextLayerService();
    return ok(await service.listAccessRequests());
  } catch (error) {
    return fromError(error);
  }
}
