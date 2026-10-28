import { describe, expect, it } from "vitest";
import type { ProfileInfo } from "#/api/profiles-service/profiles-service.api";
import type { ProviderConnection } from "#/api/provider-connections-service/provider-connections-service.api";
import {
  OTHER_PROVIDER_KEY,
  getProfileModelFamily,
  getProfileProviderId,
} from "./llm-profile-provider";

const connection: ProviderConnection = {
  id: "conn-1",
  display_name: "My Anthropic",
  provider: "anthropic",
  base_url: null,
  created_at: 1,
  updated_at: 2,
  api_key_set: true,
};
const connectionsById = { [connection.id]: connection };

const profile = (overrides: Partial<ProfileInfo>): ProfileInfo =>
  ({ name: "p", model: null, ...overrides }) as ProfileInfo;

describe("getProfileProviderId", () => {
  it("uses the linked connection's provider over the model prefix", () => {
    const linked = profile({
      model: "litellm_proxy/claude-opus-4-5",
      provider_connection_id: "conn-1",
    });

    expect(getProfileProviderId(linked, connectionsById)).toBe("anthropic");
  });

  it("falls back to the model prefix when the connection is missing", () => {
    const broken = profile({
      model: "openhands/claude-opus-4-5",
      provider_connection_id: "gone",
      provider_connection_broken: true,
    });

    expect(getProfileProviderId(broken, connectionsById)).toBe("openhands");
  });

  it("buckets profiles with no connection and no prefix as other", () => {
    expect(getProfileProviderId(profile({ model: "gpt-4o" }), {})).toBe(
      OTHER_PROVIDER_KEY,
    );
  });
});

describe("getProfileModelFamily", () => {
  it("groups a Claude model under claude whatever provider routes it", () => {
    expect(
      getProfileModelFamily(
        profile({ model: "openhands/claude-opus-4-5" }),
        connectionsById,
      ),
    ).toBe("claude");
    expect(
      getProfileModelFamily(
        profile({
          model: "openrouter/anthropic/claude-3",
          provider_connection_id: "conn-1",
        }),
        connectionsById,
      ),
    ).toBe("claude");
  });

  it("groups GPT and o-series models under openai", () => {
    expect(
      getProfileModelFamily(profile({ model: "openai/gpt-5.5" }), {}),
    ).toBe("openai");
    expect(getProfileModelFamily(profile({ model: "o3-mini" }), {})).toBe(
      "openai",
    );
  });

  it("buckets any other model under other", () => {
    expect(
      getProfileModelFamily(
        profile({ model: "openhands/glm-5.2" }),
        connectionsById,
      ),
    ).toBe("other");
  });
});
