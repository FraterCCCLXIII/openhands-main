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
    // Default mock responses. The catalog includes an OAuth provider (GitHub)
    // and a non-OAuth provider (ElevenLabs, api_key) so the page's OAuth-only
    // filtering can be asserted.
    fetchJsonMock.mockImplementation((url: string) => {
      if (url === "/api/admin/managed-connectors") {
        return Promise.resolve([
          {
            slug: "github",
            name: "GitHub",
            description: "GitHub API",
            categories: ["development", "version-control"],
            authModes: ["oauth2"],
            authStrategy: "oauth2",
            provider: "mcp",
            oauthConfigured: true,
            credentialLabel: "Connect GitHub",
            credentialPlaceholder: "Connect GitHub",
            credentialHelp: "Connect GitHub with OAuth.",
            serverUrl: "https://api.githubcopilot.com/mcp/",
            oauthConfig: {
              authorizationUrl: "https://github.com/login/oauth/authorize",
              tokenUrl: "https://github.com/login/oauth/access_token",
              scopes: ["repo"],
            },
            tools: [],
            enabled: true,
            createdAt: "2026-03-09T00:00:00.000Z",
            updatedAt: "2026-03-09T00:00:00.000Z",
          },
        ]);
      }
      if (url === "/api/integrations/managed-connectors") {
        return Promise.resolve([
          { slug: "github", name: "GitHub", authStrategy: "oauth2", oauthConfigured: true },
          { slug: "elevenlabs", name: "ElevenLabs", authStrategy: "api_key", oauthConfigured: true },
        ]);
      }
      if (url === "/api/integrations/catalog") {
        return Promise.resolve([
          {
            slug: "github",
            name: "GitHub",
            description: "GitHub API",
            categories: ["development", "version-control"],
            connectionDefaults: {
              provider: "mcp",
              authStrategy: "oauth2",
              serverUrl: "https://api.githubcopilot.com/mcp/",
              authorizationUrl: "https://github.com/login/oauth/authorize",
              tokenUrl: "https://github.com/login/oauth/access_token",
            },
          },
          {
            slug: "elevenlabs",
            name: "ElevenLabs",
            description: "Text to speech",
            categories: ["audio"],
            connectionDefaults: {
              provider: "http",
              authStrategy: "api_key",
              apiBaseUrl: "https://api.elevenlabs.io",
            },
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

  it("renders only the available OAuth providers for non-admin users", async () => {
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

    // Non-admins see the available OAuth list, not the registered list.
    // The managed-connector management controls (Delete) are admin-only.
    expect(container.textContent).toContain("available");
    expect(container.textContent).not.toContain("Delete");
    // OAuth provider is listed; non-OAuth provider is filtered out.
    expect(container.textContent).toContain("GitHub");
    expect(container.textContent).not.toContain("ElevenLabs");
    // Guidance cards were removed in the simplified page.
    expect(container.querySelector('[data-testid="user-guidance-card"]')).toBeFalsy();
    expect(container.querySelector('[data-testid="admin-guidance-card"]')).toBeFalsy();
  });

  it("renders the added and available OAuth lists for admin users", async () => {
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

    // Admins see both the added and available OAuth lists. The
    // managed-connector management controls (Delete) render for admins.
    expect(container.textContent).toContain("available");
    expect(container.textContent).toContain("Delete");
    // The registered OAuth connector appears; the non-OAuth one does not.
    expect(container.textContent).toContain("GitHub");
    expect(container.textContent).not.toContain("ElevenLabs");
    expect(container.querySelector('[data-testid="admin-guidance-card"]')).toBeFalsy();
    expect(container.querySelector('[data-testid="user-guidance-card"]')).toBeFalsy();
  });
});
