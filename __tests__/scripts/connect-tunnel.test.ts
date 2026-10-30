import { describe, expect, it } from "vitest";
import { parseCloudflaredUrl } from "../../scripts/connect-tunnel.mjs";

describe("connect-tunnel", () => {
  it("extracts a trycloudflare URL from cloudflared output", () => {
    expect(
      parseCloudflaredUrl(
        "INF |  Your quick Tunnel has been created! Visit it: https://abc-123.trycloudflare.com",
      ),
    ).toBe("https://abc-123.trycloudflare.com");
    expect(parseCloudflaredUrl("still starting")).toBeNull();
  });
});
