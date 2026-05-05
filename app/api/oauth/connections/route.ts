import { fromError, ok } from "@/src/lib/api";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";

export async function GET() {
  try {
    const { ownerId } = await getCurrentUserIdentity();
    const service = getIntegrationsHubService();
    return ok(await service.listIntegrationConnections(ownerId));
  } catch (error) {
    return fromError(error);
  }
}
