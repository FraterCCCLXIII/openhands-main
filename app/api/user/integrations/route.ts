import { ok } from "@/src/lib/api";
import { integrationCreateSchema } from "@/src/lib/core/schema";
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

export async function POST(request: Request) {
  try {
    const { ownerId } = await authenticateUserApiRequest(request);
    const payload = integrationCreateSchema.parse(await request.json());
    const service = getContextLayerService();

    return ok(await service.registerOwnerIntegration(ownerId, payload));
  } catch (error) {
    return fromUserApiError(error);
  }
}
