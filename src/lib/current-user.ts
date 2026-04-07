import { auth, isAuthDisabled } from "@/src/lib/auth";
import { ContextLayerError } from "@/src/lib/core/errors";
import { normalizeCaseInsensitiveText } from "@/src/lib/text-utils";

const DEV_USER = {
  name: "Local Dev User",
  email: "dev@localhost",
};

export const normalizeOwnerId = normalizeCaseInsensitiveText;

export const getCurrentUserIdentity = async () => {
  const session = await auth();

  if (!session?.user && !isAuthDisabled()) {
    throw new ContextLayerError("Authentication is required.", 401);
  }

  const user = session?.user ?? DEV_USER;
  const ownerId = normalizeOwnerId(
    user.email?.trim() || user.name?.trim() || DEV_USER.email,
  );

  return {
    user,
    ownerId,
  };
};
