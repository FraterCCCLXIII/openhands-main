import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { proxy } from "@/proxy";

const originalDisableAuth = process.env.DISABLE_AUTH;

const restoreDisableAuth = () => {
  if (originalDisableAuth === undefined) {
    delete process.env.DISABLE_AUTH;
    return;
  }

  process.env.DISABLE_AUTH = originalDisableAuth;
};

afterEach(() => {
  restoreDisableAuth();
});

describe("proxy", () => {
  it("allows loopback requests when auth is disabled", () => {
    process.env.DISABLE_AUTH = "true";

    const response = proxy(
      new NextRequest("http://localhost:3000/integrations", {
        headers: { host: "localhost:3000" },
      }),
    );

    expect(response.status).toBe(200);
  });

  it("blocks external API requests when auth is disabled", async () => {
    process.env.DISABLE_AUTH = "true";

    const response = proxy(
      new NextRequest("https://context-layer.example.com/api/integrations", {
        headers: { "x-forwarded-host": "context-layer.example.com" },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      detail:
        "DISABLE_AUTH is only available for localhost requests. Use GitHub sign-in for shared or deployed environments.",
    });
  });
});
