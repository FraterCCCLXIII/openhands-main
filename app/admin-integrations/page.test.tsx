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

import { ClientAdminIntegrationsPage } from "@/src/components/admin/integrations/client-page";

describe("app/admin-integrations/page (ClientAdminIntegrationsPage)", () => {
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
    // Default mock responses
    fetchJsonMock.mockImplementation((url: string) => {
      if (url === "/api/admin/managed-connectors") {
        return Promise.resolve([]);
      }
      if (url === "/api/integrations/managed-connectors") {
        return Promise.resolve([
          { slug: "github", name: "GitHub", oauthConfigured: true },
        ]);
      }
      if (url === "/api/integrations/oauth-provider-catalog") {
        return Promise.resolve([
          {
            slug: "github",
            name: "GitHub",
            description: "GitHub API",
            categories: ["development", "version-control"],
            oauthAuthorizationUrl: "https://github.com/login/oauth/authorize",
            oauthTokenUrl: "https://github.com/login/oauth/access_token",
          },
        ]);
      }
      return Promise.resolve([]);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders admin integrations page header after data loads", async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ClientAdminIntegrationsPage />
        </QueryClientProvider>,
      );
    });

    // Wait for queries to settle
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(container.textContent).toContain("Admin integrations");
    expect(container.textContent).toContain("OpenHands Integrations Hub");
  });

  it("shows user guidance card for non-admin users", async () => {
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ClientAdminIntegrationsPage />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(container.querySelector('[data-testid="user-guidance-card"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="admin-guidance-card"]')).toBeFalsy();
  });

  it("shows admin guidance card for admin users", async () => {
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
          <ClientAdminIntegrationsPage />
        </QueryClientProvider>,
      );
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(container.querySelector('[data-testid="admin-guidance-card"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="user-guidance-card"]')).toBeFalsy();
  });
});
