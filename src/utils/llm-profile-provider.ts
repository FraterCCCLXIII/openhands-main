import type { ProfileInfo } from "#/api/profiles-service/profiles-service.api";
import type { ProviderConnection } from "#/api/provider-connections-service/provider-connections-service.api";

/** Nav key that shows every profile. */
export const ALL_PROVIDERS_KEY = "__all__";

/** Nav key for profiles whose provider cannot be determined. */
export const OTHER_PROVIDER_KEY = "__other__";

/**
 * The provider a profile is routed through: its linked connection's provider
 * when that connection exists, otherwise the `provider/` prefix of its model
 * id (e.g. `openhands/claude-…` → `openhands`). A broken link falls back to
 * the model prefix. Returns {@link OTHER_PROVIDER_KEY} when neither is known.
 */
export function getProfileProviderId(
  profile: ProfileInfo,
  connectionsById: Record<string, ProviderConnection>,
): string {
  const connection = profile.provider_connection_id
    ? connectionsById[profile.provider_connection_id]
    : undefined;
  if (connection) return connection.provider;

  const model = profile.model ?? "";
  const slash = model.indexOf("/");
  return slash > 0 ? model.slice(0, slash) : OTHER_PROVIDER_KEY;
}
