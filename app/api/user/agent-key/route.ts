import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getContextLayerService } from "@/src/lib/core/runtime";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const service = getContextLayerService();

    return ok(await service.getOrCreateAgentApiKey(ownerId), {
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    return fromError(error);
  }
}

export async function POST() {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const service = getContextLayerService();

    return ok(await service.rotateAgentApiKey(ownerId), {
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    return fromError(error);
  }
}
