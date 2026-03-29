import { fromAdminApiError, authenticateAdminApiRequest } from "@/src/lib/admin-api-auth";
import { ok } from "@/src/lib/api";
import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { hasPersistentContextLayerStorage } from "@/src/lib/persistence";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await authenticateAdminApiRequest(request);

    if (process.env.NODE_ENV !== "test" && !hasPersistentContextLayerStorage()) {
      throw new ContextLayerError(
        "Managed connector deletion requires POSTGRES_URL or DATABASE_URL. This deployment has no persistent database configured.",
        503,
      );
    }

    const { slug } = await params;
    return ok(await getContextLayerService().deleteManagedConnector(slug));
  } catch (error) {
    return fromAdminApiError(error);
  }
}
