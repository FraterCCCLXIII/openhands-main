import { ok } from "@/src/lib/api";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import {
  authenticateUserApiRequest,
  fromUserApiError,
} from "@/src/lib/user-api-auth";

export async function GET(request: Request) {
  try {
    const { ownerId } = await authenticateUserApiRequest(request);
    const service = getIntegrationsHubService();

    return ok(await service.listOwnerAccessRequests(ownerId));
  } catch (error) {
    return fromUserApiError(error);
  }
}
