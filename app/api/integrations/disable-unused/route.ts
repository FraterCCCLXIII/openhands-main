import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { disableUnusedFunctionsSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";

export async function POST(request: Request) {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const payload = disableUnusedFunctionsSchema.parse(await request.json());
    const service = getContextLayerService();
    return ok(
      await service.disableUnusedOwnerFunctions(
        ownerId,
        payload.thresholdValue,
        payload.thresholdUnit,
      ),
    );
  } catch (error) {
    return fromError(error);
  }
}
