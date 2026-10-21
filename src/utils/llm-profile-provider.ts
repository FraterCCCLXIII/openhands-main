import type { ProfileInfo } from "#/api/profiles-service/profiles-service.api";
import type { ProviderConnection } from "#/api/provider-connections-service/provider-connections-service.api";

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

/** Model family a profile's model belongs to, for the profile list filter. */
export type ModelFamily = "claude" | "openai" | "other";

/** Filter key that shows every profile regardless of model family. */
export const ALL_MODEL_FAMILIES_KEY = "__all_models__";

/**
 * The model family a profile's model id belongs to. Claude is matched on the
 * model name wherever it is routed (`openhands/claude-…`, `anthropic/claude-…`).
 * OpenAI is matched on the OpenAI provider or a GPT / o-series model name.
 * Everything else is {@link ModelFamily} `other`.
 */
export function getProfileModelFamily(
  profile: ProfileInfo,
  connectionsById: Record<string, ProviderConnection>,
): ModelFamily {
  const model = profile.model ?? "";
  const name = model.slice(model.lastIndexOf("/") + 1).toLowerCase();

  if (name.includes("claude")) return "claude";
  if (
    getProfileProviderId(profile, connectionsById) === "openai" ||
    /^(gpt-|o\d|chatgpt)/.test(name)
  ) {
    return "openai";
  }
  return "other";
}
