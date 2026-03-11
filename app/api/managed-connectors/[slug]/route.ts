import { fromError, ok } from "@/src/lib/api";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { auth } from "@/src/lib/auth";
import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { hasPersistentContextLayerStorage } from "@/src/lib/persistence";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const session = await auth();
    if (!isAppAdminEmail(session?.user?.email ?? undefined)) {
      throw new ContextLayerError("Only app administrators can delete managed connectors.", 403);
    }

    if (process.env.NODE_ENV !== "test" && !hasPersistentContextLayerStorage()) {
      throw new ContextLayerError(
        "Managed connector deletion requires POSTGRES_URL or DATABASE_URL. This deployment has no persistent database configured.",
        503,
      );
    }

    const { slug } = await params;
    return ok(await getContextLayerService().deleteManagedConnector(slug));
  } catch (error) {
    return fromError(error);
  }
}
