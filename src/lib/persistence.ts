import { IntegrationsHubError } from "@/src/lib/core/errors";

export const hasPersistentIntegrationsHubStorage = () =>
  Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);

export const canUseEphemeralIntegrationsHubStorage = () => process.env.NODE_ENV === "test";

export const isIntegrationsHubStorageAvailable = () =>
  hasPersistentIntegrationsHubStorage() || canUseEphemeralIntegrationsHubStorage();

export const isEphemeralIntegrationsHubStorage = () =>
  !hasPersistentIntegrationsHubStorage() && !canUseEphemeralIntegrationsHubStorage();

export const assertIntegrationsHubStorageAvailable = () => {
  if (!isIntegrationsHubStorageAvailable()) {
    throw new IntegrationsHubError(
      "Service unavailable. This deployment requires POSTGRES_URL or DATABASE_URL before the integrations hub can be used.",
      503,
    );
  }
};
