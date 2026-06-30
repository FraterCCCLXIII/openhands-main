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

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
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

  it("renders the available providers (OAuth and MCP) for non-admin users", async () => {
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

    // Non-admins see the available list, not the registered list.
    // The managed-connector management controls (Delete) are admin-only.
    expect(container.textContent).toContain("available");
    expect(container.textContent).not.toContain("Delete");
    // Both OAuth and non-OAuth (api_key/MCP) providers are listed — the page
    // no longer filters to OAuth-only.
    expect(container.textContent).toContain("GitHub");
    expect(container.textContent).toContain("ElevenLabs");
    // Guidance cards were removed in the simplified page.
    expect(container.querySelector('[data-testid="user-guidance-card"]')).toBeFalsy();
    expect(container.querySelector('[data-testid="admin-guidance-card"]')).toBeFalsy();
  });

  it("renders the added and available lists (OAuth and MCP) for admin users", async () => {
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

    // Admins see the unified connector list. The registered connector
    // (GitHub) shows "steps done" in its header. Expanding it reveals
    // the management controls (Delete).
    expect(container.textContent).toContain("GitHub");
    expect(container.textContent).toContain("ElevenLabs");

    // Expand the registered GitHub connector to see the Delete button.
    const githubToggle = Array.from(
      container.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'),
    ).find((btn) => btn.textContent?.includes("GitHub"));
    expect(githubToggle).toBeTruthy();

    await act(async () => {
      githubToggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Step 1 (Configure integration) starts collapsed because it's completed.
    // Expand it to reveal the Delete button inside the config form.
    const step1Toggle = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Expand Configure integration"]',
    );
    expect(step1Toggle).toBeTruthy();
    await act(async () => {
      step1Toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Delete");
    expect(container.querySelector('[data-testid="admin-guidance-card"]')).toBeFalsy();
    expect(container.querySelector('[data-testid="user-guidance-card"]')).toBeFalsy();
  });
});
