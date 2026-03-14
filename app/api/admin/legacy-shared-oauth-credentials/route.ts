import { fromError, ok } from "@/src/lib/api";
import { isAppAdminEmail } from "@/src/lib/app-admins";
import { auth } from "@/src/lib/auth";
import { ContextLayerError } from "@/src/lib/core/errors";
import { getContextLayerService } from "@/src/lib/core/runtime";
import { hasPersistentContextLayerStorage } from "@/src/lib/persistence";

const assertAdminAccess = async () => {
  const session = await auth();
  if (!isAppAdminEmail(session?.user?.email ?? undefined)) {
    throw new ContextLayerError(
      "Only app administrators can inspect or scrub legacy shared OAuth credentials.",
      403,
    );
  }

  if (process.env.NODE_ENV !== "test" && !hasPersistentContextLayerStorage()) {
    throw new ContextLayerError(
      "Legacy shared OAuth credential cleanup requires POSTGRES_URL or DATABASE_URL. This deployment has no persistent database configured.",
      503,
    );
  }
}

export async function GET() {
  try {
    await assertAdminAccess();
    const legacySharedOAuthCredentials =
      await getContextLayerService().listLegacySharedOAuthCredentials();

    return ok({
      legacySharedOAuthCredentials,
      count: legacySharedOAuthCredentials.length,
    });
  } catch (error) {
    return fromError(error);
  }
}

export async function DELETE() {
  try {
    await assertAdminAccess();
    return ok(await getContextLayerService().scrubLegacySharedOAuthCredentials());
  } catch (error) {
    return fromError(error);
  }
}
