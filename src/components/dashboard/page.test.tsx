import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  authMock,
  headersMock,
  dashboardWorkspaceMock,
  getCurrentUserIdentityMock,
  serviceMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "user@example.com" } })),
  headersMock: vi.fn(async () => new Headers()),
  dashboardWorkspaceMock: vi.fn((_props: unknown) => null),
  getCurrentUserIdentityMock: vi.fn(async () => ({
    user: { name: "User", email: "user@example.com" },
    ownerId: "user@example.com",
  })),
  serviceMock: {
    listOwnerIntegrationsWithUsage: vi.fn(async () => []),
    listAccessRequests: vi.fn(async () => [{ id: "req-1" }]),
    listNotifications: vi.fn(async () => []),
    getOrCreateAgentApiKey: vi.fn(async () => ({ apiKey: "cla_test" })),
    getUserApiKeyStatus: vi.fn(async () => null),
    getAdminApiKeyStatus: vi.fn(async () => null),
  },
}));

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

vi.mock("@/src/components/dashboard/workspace", () => ({
  DashboardWorkspace: (props: unknown) => {
    dashboardWorkspaceMock(props);
    return null;
  },
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
  isAuthDisabled: () => false,
}));

vi.mock("@/src/lib/current-user", () => ({
  getCurrentUserIdentity: getCurrentUserIdentityMock,
}));

vi.mock("@/src/lib/core/runtime", () => ({
  getContextLayerService: () => serviceMock,
}));

vi.mock("@/src/lib/persistence", () => ({
  isEphemeralContextLayerStorage: () => false,
}));

vi.mock("@/src/lib/request-context", () => ({
  getRequestOrigin: () => "https://example.com",
}));

import { DashboardPage } from "./page";

beforeEach(() => {
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "user@example.com" } });
  headersMock.mockClear();
  dashboardWorkspaceMock.mockClear();
  getCurrentUserIdentityMock.mockReset();
  getCurrentUserIdentityMock.mockResolvedValue({
    user: { name: "User", email: "user@example.com" },
    ownerId: "user@example.com",
  });
  serviceMock.listOwnerIntegrationsWithUsage.mockClear();
  serviceMock.listOwnerIntegrationsWithUsage.mockResolvedValue([]);
  serviceMock.listAccessRequests.mockClear();
  serviceMock.listAccessRequests.mockResolvedValue([{ id: "req-1" }]);
  serviceMock.listNotifications.mockClear();
  serviceMock.listNotifications.mockResolvedValue([]);
  serviceMock.getOrCreateAgentApiKey.mockClear();
  serviceMock.getOrCreateAgentApiKey.mockResolvedValue({ apiKey: "cla_test" });
  serviceMock.getUserApiKeyStatus.mockClear();
  serviceMock.getUserApiKeyStatus.mockResolvedValue(null);
  serviceMock.getAdminApiKeyStatus.mockClear();
  serviceMock.getAdminApiKeyStatus.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("DashboardPage", () => {
  it("does not preload access requests for non-admin users", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");

    renderToStaticMarkup(await DashboardPage());

    expect(serviceMock.listAccessRequests).not.toHaveBeenCalled();
    expect(dashboardWorkspaceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        initialAccessRequests: [],
        isAdmin: false,
      }),
    );
  });
});
