// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

const { useAuthMock, fetchJsonMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(() => ({
    user: { name: "User", email: "user@example.com" },
    ownerId: "user@example.com",
    isAdmin: false,
    isLoading: false,
    isAuthenticated: true,
    authDisabled: false,
  })),
  fetchJsonMock: vi.fn(),
}));

vi.mock("@/src/components/auth/auth-context", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/src/lib/fetch-json", () => ({
  fetchJson: fetchJsonMock,
}));

import { ClientAdminOverviewPage } from "@/src/components/admin/overview/client-page";

describe("app/admin-overview/page (ClientAdminOverviewPage)", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    root = createRoot(container);
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      user: { name: "User", email: "user@example.com" },
      ownerId: "user@example.com",
      isAdmin: false,
      isLoading: false,
      isAuthenticated: true,
      authDisabled: false,
    });
    fetchJsonMock.mockReset();
    // Default mock responses matching AdminOperationalOverview type
    fetchJsonMock.mockImplementation((url: string) => {
      if (url === "/api/admin/overview") {
        return Promise.resolve({
          connectedOwners: 3,
          managedConnectors: 1,
          totalConnections: 3,
          notifications: 1,
          totalAccessRequests: 1,
          pendingAccessRequests: 1,
          users: [
            {
              ownerId: "owner-a@example.com",
              totalConnections: 1,
              pendingAccessRequests: 1,
              notifications: 1,
              integrations: [],
              providers: [],
              totalAccessRequests: 0,
              duplicateExternalAccounts: [],
              connections: [],
            },
            {
              ownerId: "owner-b@example.com",
              totalConnections: 1,
              pendingAccessRequests: 0,
              notifications: 0,
              integrations: [],
              providers: [],
              totalAccessRequests: 0,
              duplicateExternalAccounts: [],
              connections: [],
            },
            {
              ownerId: "owner-c@example.com",
              totalConnections: 1,
              pendingAccessRequests: 0,
              notifications: 0,
              integrations: [],
              providers: [],
              totalAccessRequests: 0,
              duplicateExternalAccounts: [],
              connections: [],
            },
          ],
          duplicateExternalAccounts: [
            { provider: "github", externalAccountId: "xingyaoww", ownerIds: ["owner-a@example.com", "owner-b@example.com"] },
          ],
        });
      }
      return Promise.resolve({});
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("shows an admin access gate for non-admin users", async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ClientAdminOverviewPage />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(container.querySelector('[data-testid="admin-overview-gated-card"]')).toBeTruthy();
    expect(container.textContent).toContain("Admin access required");
    expect(container.querySelector('[data-testid="admin-overview-users-card"]')).toBeFalsy();
  });

  it("renders user browser card with expandable user rows for admins", async () => {
    useAuthMock.mockReturnValue({
      user: { name: "Admin", email: "admin@example.com" },
      ownerId: "admin@example.com",
      isAdmin: true,
      isLoading: false,
      isAuthenticated: true,
      authDisabled: false,
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ClientAdminOverviewPage />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(container.querySelector('[data-testid="admin-overview-users-card"]')).toBeTruthy();
    expect(container.textContent).toContain("Browse users");
    expect(container.textContent).toContain("Shown");
    expect(container.textContent).toContain("Connected owners");
    expect(container.textContent).toContain("owner-a@example.com");
    expect(container.textContent).toContain("owner-b@example.com");
    expect(container.textContent).toContain("owner-c@example.com");
    expect(
      container.querySelectorAll('[data-testid="admin-overview-user-row-caret"]'),
    ).toHaveLength(3);
  });

  it("shows duplicate group count in badges for admins", async () => {
    useAuthMock.mockReturnValue({
      user: { name: "Admin", email: "admin@example.com" },
      ownerId: "admin@example.com",
      isAdmin: true,
      isLoading: false,
      isAuthenticated: true,
      authDisabled: false,
    });

    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ClientAdminOverviewPage />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    // The duplicates section shows a count badge and description for duplicate external-account groups
    expect(container.textContent).toContain("Duplicate external accounts");
    expect(container.textContent).toContain("duplicate external-account groups");
  });
});
