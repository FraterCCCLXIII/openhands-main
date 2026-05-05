import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { IntegrationsHubError } from "@/src/lib/core/errors";
import { getIntegrationsHubService } from "@/src/lib/core/runtime";
import { hasPersistentIntegrationsHubStorage } from "@/src/lib/persistence";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await authenticateAdminApiRequest(request);

    if (process.env.NODE_ENV !== "test" && !hasPersistentIntegrationsHubStorage()) {
      throw new IntegrationsHubError(
        "Managed connector deletion requires POSTGRES_URL or DATABASE_URL. This deployment has no persistent database configured.",
        503,
      );
    }

    const { slug } = await params;
    return ok(await getIntegrationsHubService().deleteManagedConnector(slug));
  } catch (error) {
    return fromAdminApiError(error);
  }
}
