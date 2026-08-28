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

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin-overview",
}));

vi.mock("@/src/hooks/use-pending-approvals-count", () => ({
  usePendingApprovalsCount: () => 0,
}));

vi.mock("@/src/hooks/use-pending-user-requests-count", () => ({
  usePendingUserRequestsCount: () => 0,
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
    expect(container.textContent).toContain("connected owners");
    expect(container.textContent).toContain("owner-a@example.com");
    expect(container.textContent).toContain("owner-b@example.com");
    expect(container.textContent).toContain("owner-c@example.com");
    expect(container.textContent).toContain("1 connection");
    expect(container.textContent).toContain("1 pending");
    expect(
      container.querySelectorAll('[data-testid="admin-overview-user-row-caret"]'),
    ).toHaveLength(3);

    const firstRow = container.querySelector<HTMLButtonElement>(
      '[data-testid="admin-overview-user-row"] button',
    );
    expect(firstRow).toBeTruthy();
    await act(async () => {
      firstRow?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(document.querySelector('[role="dialog"]')).toBeTruthy();
    expect(
      document.querySelector('[data-testid="admin-overview-user-details"]'),
    ).toBeTruthy();
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

    expect(container.textContent).toContain("duplicate external accounts");
    expect(container.querySelector('[data-testid="admin-overview-duplicates-card"]')).toBeTruthy();
    expect(container.textContent).toContain("github");
    expect(container.textContent).toContain("xingyaoww");
    expect(container.textContent).toContain("2 owners");

    const duplicateRow = container.querySelector<HTMLButtonElement>(
      '[data-testid="admin-overview-duplicate-group-row"] button',
    );
    expect(duplicateRow).toBeTruthy();
    await act(async () => {
      duplicateRow?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    expect(
      document.querySelector('[data-testid="admin-overview-duplicate-group-modal"]'),
    ).toBeTruthy();
    expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
      "owner-a@example.com",
    );
  });
});
