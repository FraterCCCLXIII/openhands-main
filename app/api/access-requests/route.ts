import { fromError, ok } from "@/src/lib/api";
import { requireAppAdminSession } from "@/src/lib/app-admin-session";
import { accessRequestCreateSchema } from "@/src/lib/core/schema";
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

export async function POST(request: Request) {
  try {
    await requireAppAdminSession();
    const payload = accessRequestCreateSchema.parse(await request.json());
    const service = getContextLayerService();
    return ok(await service.createAccessRequest(payload));
  } catch (error) {
    return fromError(error);
  }
}
