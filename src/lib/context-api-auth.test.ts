import { describe, expect, it } from "vitest";

import {
  DEFAULT_LOCAL_CONTEXT_API_KEY,
  extractContextApiKey,
  getContextApiAuthStatus,
  getContextApiKeys,
  isContextApiKeyAuthorized,
} from "@/src/lib/context-api-auth";

const env = (values: Record<string, string>) =>
  values as unknown as NodeJS.ProcessEnv;

describe("context-api-auth", () => {
  it("uses explicitly configured API keys", () => {
    expect(
      getContextApiKeys(
        env({
          CONTEXT_LAYER_API_KEY: "primary-key",
          CONTEXT_LAYER_API_KEYS: "backup-one, backup-two",
        }),
      ),
    ).toEqual(["primary-key", "backup-one", "backup-two"]);
  });

  it("falls back to a localhost-only default key in local auth bypass mode", () => {
    expect(getContextApiKeys(env({ DISABLE_AUTH: "true" }))).toEqual([
      DEFAULT_LOCAL_CONTEXT_API_KEY,
    ]);
    expect(getContextApiAuthStatus(env({ DISABLE_AUTH: "true" }))).toMatchObject({
      configured: true,
      primaryKey: DEFAULT_LOCAL_CONTEXT_API_KEY,
      usingDefaultLocalKey: true,
    });
  });

  it("extracts API keys from bearer auth or X-API-Key headers", () => {
    expect(
      extractContextApiKey(
        new Headers({ authorization: "Bearer context-layer-key" }),
      ),
    ).toBe("context-layer-key");
    expect(
      extractContextApiKey(new Headers({ "x-api-key": "context-layer-key" })),
    ).toBe("context-layer-key");
  });

  it("authorizes only configured context-layer keys", () => {
    const requestHeaders = new Headers({ authorization: "Bearer valid-key" });

    expect(
      isContextApiKeyAuthorized(requestHeaders, env({ CONTEXT_LAYER_API_KEY: "valid-key" })),
    ).toBe(true);
    expect(
      isContextApiKeyAuthorized(requestHeaders, env({ CONTEXT_LAYER_API_KEY: "different-key" })),
    ).toBe(false);
  });
});
