import { ok } from "@/src/lib/api";
import { integrationCreateSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { assertUserCanSaveIntegration } from "@/src/lib/integrations/user-connector-guardrails";
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
    const identity = await authenticateUserApiRequest(request);
    const payload = integrationCreateSchema.parse(await request.json());
    assertUserCanSaveIntegration(identity.isAdmin, payload);
    const service = getContextLayerService();

    return ok(await service.registerOwnerIntegration(identity.ownerId, payload));
  } catch (error) {
    return fromUserApiError(error);
  }
}
