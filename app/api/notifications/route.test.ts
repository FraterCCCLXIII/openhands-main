import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type AuthSession = { user: { email: string } } | null;

const { authMock, serviceMock } = vi.hoisted(() => ({
  authMock: vi.fn<() => Promise<AuthSession>>(async () => ({
    user: { email: "admin@example.com" },
  })),
  serviceMock: {
    listNotifications: vi.fn(async () => [
      {
        id: "notification-1",
        channel: "in_app",
        recipient: "admin@example.com",
        subject: "Approval requested",
        body: "body",
        metadata: {},
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]),
  },
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/src/lib/core/runtime", () => ({
  getContextLayerService: () => serviceMock,
}));

import { GET } from "./route";

describe("/api/notifications", () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });
    serviceMock.listNotifications.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns notifications for authenticated admin users", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");

    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(serviceMock.listNotifications).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual([
      expect.objectContaining({
        id: "notification-1",
        subject: "Approval requested",
      }),
    ]);
  });

  it("requires an authenticated session", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      detail: "Authentication is required.",
    });
    expect(serviceMock.listNotifications).not.toHaveBeenCalled();
  });

  it("rejects non-admin sessions", async () => {
    authMock.mockResolvedValue({ user: { email: "user@example.com" } });

    const response = await GET();

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      detail: "Only app administrators can view notifications.",
    });
    expect(serviceMock.listNotifications).not.toHaveBeenCalled();
  });
});
