import { accessRequestCreateSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { fromError, ok } from "@/src/lib/api";

export async function GET() {
  try {
    const service = getContextLayerService();
    return ok(await service.listAccessRequests());
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = accessRequestCreateSchema.parse(await request.json());
    const service = getContextLayerService();
    return ok(await service.createAccessRequest(payload));
  } catch (error) {
    return fromError(error);
  }
}
