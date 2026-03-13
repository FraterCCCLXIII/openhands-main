import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { integrationCreateSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function GET() {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const service = getContextLayerService();
    return ok(await service.listOwnerIntegrations(ownerId));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const payload = integrationCreateSchema.parse(await request.json());
    const service = getContextLayerService();
    return ok(await service.registerOwnerIntegration(ownerId, payload));
  } catch (error) {
    return fromError(error);
  }
}
