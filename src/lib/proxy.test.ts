import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { encode } from "next-auth/jwt";

import { proxy } from "@/proxy";

const originalDisableAuth = process.env.DISABLE_AUTH;
const originalAuthSecret = process.env.AUTH_SECRET;

const restoreDisableAuth = () => {
  if (originalDisableAuth === undefined) {
    delete process.env.DISABLE_AUTH;
    return;
  }

  process.env.DISABLE_AUTH = originalDisableAuth;
};

const restoreAuthSecret = () => {
  if (originalAuthSecret === undefined) {
    delete process.env.AUTH_SECRET;
    return;
  }

  process.env.AUTH_SECRET = originalAuthSecret;
};

afterEach(() => {
  restoreDisableAuth();
  restoreAuthSecret();
});

describe("proxy", () => {
  it("allows loopback requests when auth is disabled", async () => {
    process.env.DISABLE_AUTH = "true";

    const response = await proxy(
      new NextRequest("http://localhost:3000/integrations", {
        headers: { host: "localhost:3000" },
      }),
    );

    expect(response.status).toBe(200);
  });

  it("blocks external API requests when auth is disabled", async () => {
    process.env.DISABLE_AUTH = "true";

    const response = await proxy(
      new NextRequest("https://integrations-hub.example.com/api/integrations", {
        headers: { "x-forwarded-host": "integrations-hub.example.com" },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      detail:
        "DISABLE_AUTH is only available for localhost requests. Use GitHub sign-in for shared or deployed environments.",
    });
  });

  it("applies baseline security headers to successful responses", async () => {
    const response = await proxy(
      new NextRequest("https://integrations-hub.example.com/integrations", {
        headers: { host: "integrations-hub.example.com" },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
    expect(response.headers.get("permissions-policy")).toBe(
      "camera=(), geolocation=(), microphone=()",
    );
    expect(response.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains",
    );
  });

  it("applies baseline security headers to blocked API responses", async () => {
    process.env.DISABLE_AUTH = "true";

    const response = await proxy(
      new NextRequest("https://integrations-hub.example.com/api/integrations", {
        headers: { host: "integrations-hub.example.com" },
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("strict-transport-security")).toBe(
      "max-age=31536000; includeSubDomains",
    );
    await expect(response.json()).resolves.toEqual({
      detail:
        "DISABLE_AUTH is only available for localhost requests. Use GitHub sign-in for shared or deployed environments.",
    });
  });

  it("requires a signed-in dashboard session for user key endpoints", async () => {
    process.env.DISABLE_AUTH = "false";
    process.env.AUTH_SECRET = "test-secret";

    const response = await proxy(
      new NextRequest("https://integrations-hub.example.com/api/user/key", {
        headers: { host: "integrations-hub.example.com", "x-owner-id": "attacker@example.com" },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      detail: "Sign in to the dashboard before using this endpoint.",
    });
  });


  it("accepts a signed-in secure Auth.js session for user key endpoints", async () => {
    process.env.DISABLE_AUTH = "false";
    process.env.AUTH_SECRET = "test-secret";
    const sessionToken = await encode({
      secret: "test-secret",
      salt: "__Secure-authjs.session-token",
      token: { email: "user@example.com" },
    });

    const response = await proxy(
      new NextRequest("https://integrations-hub.example.com/api/user/key", {
        headers: {
          cookie: `__Secure-authjs.session-token=${sessionToken}`,
          host: "integrations-hub.example.com",
        },
      }),
    );

    expect(response.status).toBe(200);
  });

  it("rejects spoofed loopback forwarded hosts when auth is disabled", async () => {
    process.env.DISABLE_AUTH = "true";

    const response = await proxy(
      new NextRequest("https://integrations-hub.example.com/api/integrations", {
        headers: {
          host: "integrations-hub.example.com",
          "x-forwarded-host": "localhost:3000",
        },
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      detail:
        "DISABLE_AUTH is only available for localhost requests. Use GitHub sign-in for shared or deployed environments.",
    });
  });

});
