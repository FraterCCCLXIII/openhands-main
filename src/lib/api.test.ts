import { describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "admin@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

import { fromError } from "@/src/lib/api";
import { ContextLayerError } from "@/src/lib/core/errors";

describe("fromError", () => {
  it("includes sanitized debug details for app admins", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com,ops@example.com");

    const response = await fromError(
      new ContextLayerError("Discovery failed.", 504, {
        operationName: "listTools",
        auth: {
          authStrategy: "oauth2",
          accessToken: {
            present: true,
            length: 212,
            startsWithBearerPrefix: false,
          },
        },
      }),
    );

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({
      detail: "Discovery failed.",
      debug: {
        operationName: "listTools",
        auth: {
          authStrategy: "oauth2",
          accessToken: {
            present: true,
            length: 212,
            startsWithBearerPrefix: false,
          },
        },
      },
    });
  });

  it("omits debug details for non-admin users", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValueOnce({ user: { email: "user@example.com" } });

    const response = await fromError(
      new ContextLayerError("Discovery failed.", 504, {
        operationName: "listTools",
      }),
    );

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toEqual({
      detail: "Discovery failed.",
    });
  });
});
