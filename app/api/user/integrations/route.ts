import { ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";
import {
  authenticateUserApiRequest,
  fromUserApiError,
} from "@/src/lib/user-api-auth";

export async function GET(request: Request) {
  try {
    const { ownerId } = await authenticateUserApiRequest(request);
    const service = getContextLayerService();

    return ok(await service.listOwnerIntegrations(ownerId));
  } catch (error) {
    return fromUserApiError(error);
  }
}
