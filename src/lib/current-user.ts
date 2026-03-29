import { ContextLayerError } from "@/src/lib/core/errors";
import { auth, isAuthDisabled } from "@/src/lib/auth";

const DEV_USER = {
  name: "Local Dev User",
  email: "dev@localhost",
};

export const normalizeOwnerId = (value: string) => value.trim().toLowerCase();

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
