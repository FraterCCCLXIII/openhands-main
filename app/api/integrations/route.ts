import { fromError, ok } from "@/src/lib/api";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { auth } from "@/src/lib/auth";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { integrationCreateSchema } from "@/src/lib/core/schema";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { filterIntegrationsVisibleToOwner } from "@/src/lib/integrations/visible-integrations";

export async function GET() {
  try {
    const service = getContextLayerService();
    const session = await auth();
    const integrations = await service.listIntegrations();

    if (isAppAdminEmail(session?.user?.email ?? undefined)) {
      return ok(integrations);
    }

    const { ownerId } = await getCurrentUserIdentity();
    const connections = await service.listIntegrationConnections(ownerId);
    return ok(filterIntegrationsVisibleToOwner(integrations, connections));
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = integrationCreateSchema.parse(await request.json());
    const service = getContextLayerService();
    return ok(await service.registerIntegration(payload));
  } catch (error) {
    return fromError(error);
  }
}
