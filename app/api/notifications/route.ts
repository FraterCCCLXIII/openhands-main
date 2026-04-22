import { auth } from "@/src/lib/auth";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { fromError, ok } from "@/src/lib/api";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { ContextLayerError } from "@/src/lib/core/errors";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      throw new ContextLayerError("Authentication is required.", 401);
    }

    if (!isAppAdminEmail(session.user.email ?? undefined)) {
      throw new ContextLayerError("Only app administrators can view notifications.", 403);
    }

    const service = getContextLayerService();
    return ok(await service.listNotifications(), { headers: NO_STORE_HEADERS });
  } catch (error) {
    return fromError(error);
  }
}
