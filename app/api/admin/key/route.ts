import { fromError, ok } from "@/src/lib/api";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { auth, isAuthDisabled } from "@/src/lib/auth";
import { getCurrentUserIdentity } from "@/src/lib/current-user";
import { IntegrationsHubError } from "@/src/lib/core/errors";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

const requireAdminSession = async () => {
  const session = await auth();

  if (!session?.user && !isAuthDisabled()) {
    throw new IntegrationsHubError("Authentication is required.", 401);
  }

  const identity = await getCurrentUserIdentity();
  if (!isAppAdminEmail(identity.ownerId)) {
    throw new IntegrationsHubError("Only app administrators can manage admin API keys.", 403);
  }

  return identity;
};

export async function GET() {
  try {
    const { ownerId } = await requireAdminSession();
    const service = getIntegrationsHubService();
    const key = await service.getAdminApiKeyStatus(ownerId);
    return ok(
      {
        hasKey: key !== null,
        key,
        apiKey: await service.getAdminApiKeyValue(ownerId),
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return fromError(error);
  }
}

export async function POST() {
  try {
    const { ownerId } = await requireAdminSession();
    const service = getIntegrationsHubService();
    return ok(await service.rotateAdminApiKey(ownerId), {
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE() {
  try {
    const { ownerId } = await requireAdminSession();
    const service = getIntegrationsHubService();
    return ok(await service.revokeAdminApiKey(ownerId), {
      headers: NO_STORE_HEADERS,
    });
  } catch (error) {
    return fromError(error);
  }
}
