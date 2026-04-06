import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { toolCreateSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ integrationKey: string }> },
) {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const payload = toolCreateSchema.parse(await request.json());
    const { integrationKey } = await params;
    const service = getContextLayerService();
    return ok(await service.addOwnerTool(ownerId, integrationKey, payload));
  } catch (error) {
    return fromError(error);
  }
}
