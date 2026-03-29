import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";
import {
  authenticateUserApiRequest,
  fromUserApiError,
} from "@/src/lib/user-api-auth";

export async function GET(request: Request) {
  try {
    await authenticateUserApiRequest(request, { requireAdmin: true });
    const service = getContextLayerService();

    return ok(await service.listAccessRequests());
  } catch (error) {
    return fromUserApiError(error);
  }
}
