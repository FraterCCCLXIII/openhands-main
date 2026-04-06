import { isAppAdminEmail } from "@/src/lib/app-admins";
import { auth } from "@/src/lib/auth";
import { ContextLayerError } from "@/src/lib/core/errors";
import { normalizeOwnerId } from "@/src/lib/current-user";

export const requireAppAdminSession = async () => {
  const session = await auth();
  const user = session?.user;
  const email = user?.email?.trim();

  if (!user || !email) {
    throw new ContextLayerError("Authentication is required.", 401);
  }

  const ownerId = normalizeOwnerId(email);
  if (!isAppAdminEmail(ownerId)) {
    throw new ContextLayerError(
      "Only app administrators can manage access requests.",
      403,
    );
  }

  return {
    ownerId,
    user,
  };
};
