import { ContextLayerError } from "@/src/lib/core/errors";

export const hasPersistentContextLayerStorage = () =>
  Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);

export const canUseEphemeralContextLayerStorage = () => process.env.NODE_ENV === "test";

export const isContextLayerStorageAvailable = () =>
  hasPersistentContextLayerStorage() || canUseEphemeralContextLayerStorage();

export const isEphemeralContextLayerStorage = () =>
  !hasPersistentContextLayerStorage() && !canUseEphemeralContextLayerStorage();

export const assertContextLayerStorageAvailable = () => {
  if (!isContextLayerStorageAvailable()) {
    throw new ContextLayerError(
      "Service unavailable. This deployment requires POSTGRES_URL or DATABASE_URL before the context layer can be used.",
      503,
    );
  }
};
