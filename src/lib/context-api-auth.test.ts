import { describe, expect, it } from "vitest";

import { extractContextApiKey } from "@/src/lib/context-api-auth";

describe("context-api-auth", () => {
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

  it("returns an empty string when no API key is present", () => {
    expect(extractContextApiKey(new Headers())).toBe("");
  });
});
