// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";
import type { ManagedConnectorDefinition } from "@/src/types/integrations-hub";

enableReactActEnvironment();

const { useAuthMock, fetchJsonMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  fetchJsonMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin-user-requests",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/src/hooks/use-pending-approvals-count", () => ({
  usePendingApprovalsCount: () => 0,
}));

vi.mock("@/src/hooks/use-pending-user-requests-count", () => ({
  usePendingUserRequestsCount: () => 2,
}));

vi.mock("@/src/components/auth/auth-context", () => ({
  useAuth: useAuthMock,
}));

vi.mock("@/src/lib/fetch-json", () => ({
  fetchJson: fetchJsonMock,
}));

vi.mock("@/src/components/admin/integrations/unified-connector-list", () => ({
  UnifiedConnectorList: ({
    initialExpandedSlug,
    onConnectorRegistered,
    onModalClose,
  }: {
    initialExpandedSlug?: string | null;
    onConnectorRegistered?: (connector: ManagedConnectorDefinition) => void;
    onModalClose?: () => void;
  }) => (
    <div data-testid={`connector-details-modal-${initialExpandedSlug ?? ""}`}>
      <button
        type="button"
        data-testid={`connector-details-modal-close-${initialExpandedSlug ?? ""}`}
        onClick={onModalClose}
      >
        Close
      </button>
      <button
        type="button"
        data-testid="complete-connector-register"
        onClick={() =>
          onConnectorRegistered?.({
            slug: initialExpandedSlug ?? "asana",
            name: "Asana",
            description: "Work management",
            categories: ["Project management"],
            authModes: ["oauth2"],
            authStrategy: "oauth2",
            provider: "mcp",
            credentialLabel: "OAuth",
            credentialPlaceholder: "",
            credentialHelp: "",
            tools: [],
            enabled: true,
            createdAt: "2026-08-27T00:00:00.000Z",
            updatedAt: "2026-08-27T00:00:00.000Z",
          })
        }
      >
        Register
      </button>
    </div>
  ),
}));

vi.mock("@/src/components/admin/integrations/add-custom-mcp-modal", () => ({
  AddCustomMcpModal: ({
    initialName,
    onClose,
    onRegistered,
  }: {
    initialName?: string;
    onClose: () => void;
    onRegistered: (connector: ManagedConnectorDefinition) => void;
  }) => (
    <div data-testid="add-custom-mcp-modal">
      <p data-testid="add-custom-mcp-initial-name">{initialName}</p>
      <button type="button" data-testid="add-custom-mcp-modal-close" onClick={onClose}>
        Close
      </button>
      <button
        type="button"
        data-testid="complete-custom-register"
        onClick={() =>
          onRegistered({
            slug: "internal-wiki",
            name: initialName ?? "Internal Wiki",
            description: "Custom MCP",
            categories: ["Custom"],
            authModes: ["bearer"],
            authStrategy: "bearer",
            provider: "mcp",
            credentialLabel: "Access token",
            credentialPlaceholder: "",
            credentialHelp: "",
            tools: [],
            enabled: true,
            createdAt: "2026-08-27T00:00:00.000Z",
            updatedAt: "2026-08-27T00:00:00.000Z",
          })
        }
      >
        Register
      </button>
    </div>
  ),
}));

import { ClientAdminUserRequestsPage } from "@/src/components/admin/user-requests/client-page";

const pendingRequest = {
  id: "req-asana",
  source: "catalog",
  slug: "asana",
  name: "Asana",
  notes: "Need this for planning.",
  requestedBy: "alex@example.com",
  status: "pending",
  createdAt: "2026-08-26T15:20:00.000Z",
};

const customRequest = {
  id: "req-custom",
  source: "custom",
  name: "Internal Wiki",
  notes: "Need a private knowledge base.",
  requestedBy: "alex@example.com",
  status: "pending",
  createdAt: "2026-08-26T16:20:00.000Z",
};

const asanaCatalogEntry = {
  slug: "asana",
  name: "Asana",
  description: "Work management",
  categories: ["Project management"],
  notes: "",
  popularityRank: 3,
  connectionDefaults: { authStrategy: "oauth2" },
};

describe("ClientAdminUserRequestsPage", () => {
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
    fetchJsonMock.mockReset();
    useAuthMock.mockReset();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    queryClient.clear();
  });

  const renderPage = async (
    isAdmin: boolean,
    requests: Array<typeof pendingRequest | typeof customRequest> = [pendingRequest],
  ) => {
    useAuthMock.mockReturnValue({
      user: { name: "Admin User", email: "admin@example.com" },
      ownerId: "admin@example.com",
      isAdmin,
      isLoading: false,
      isAuthenticated: true,
      authDisabled: false,
    });
    fetchJsonMock.mockImplementation((url: string) => {
      if (url === "/api/admin/integration-requests") {
        return Promise.resolve(requests);
      }
      if (url === "/api/admin/modify-integrations") {
        return Promise.resolve([]);
      }
      if (url === "/api/integrations?filter=all") {
        return Promise.resolve([asanaCatalogEntry]);
      }
      if (url === "/api/oauth/connections") {
        return Promise.resolve([]);
      }
      return Promise.resolve(pendingRequest);
    });
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <ClientAdminUserRequestsPage />
        </QueryClientProvider>,
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  };

  it("gates the page for non-admins", async () => {
    await renderPage(false);
    expect(container.querySelector('[data-testid="user-requests-gated-card"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="user-requests-list"]')).toBeNull();
  });

  it("lists pending requests and dismisses one", async () => {
    await renderPage(true);
    expect(container.querySelector('[data-testid="user-request-row-req-asana"]')).toBeTruthy();
    expect(container.textContent).toContain("Asana");
    expect(container.textContent).toContain("alex@example.com");

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="user-request-dismiss-req-asana"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchJsonMock).toHaveBeenCalledWith(
      "/api/admin/integration-requests/req-asana/dismiss",
      { method: "POST" },
    );
  });

  it("opens the catalog add modal without marking the request added", async () => {
    await renderPage(true);
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="user-request-add-req-asana"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="connector-details-modal-asana"]')).toBeTruthy();
    expect(fetchJsonMock).not.toHaveBeenCalledWith(
      "/api/admin/integration-requests/req-asana/add",
      { method: "POST" },
    );

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="connector-details-modal-close-asana"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.querySelector('[data-testid="connector-details-modal-asana"]')).toBeNull();
    expect(fetchJsonMock).not.toHaveBeenCalledWith(
      "/api/admin/integration-requests/req-asana/add",
      { method: "POST" },
    );
    expect(container.querySelector('[data-testid="user-request-row-req-asana"]')).toBeTruthy();
  });

  it("marks the request added only after the connector is registered", async () => {
    await renderPage(true);
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="user-request-add-req-asana"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="complete-connector-register"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchJsonMock).toHaveBeenCalledWith(
      "/api/admin/integration-requests/req-asana/add",
      { method: "POST" },
    );
  });

  it("opens the custom MCP modal for custom requests and marks added after register", async () => {
    await renderPage(true, [customRequest]);
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="user-request-add-req-custom"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="add-custom-mcp-modal"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="add-custom-mcp-initial-name"]')?.textContent).toBe(
      "Internal Wiki",
    );
    expect(fetchJsonMock).not.toHaveBeenCalledWith(
      "/api/admin/integration-requests/req-custom/add",
      { method: "POST" },
    );

    await act(async () => {
      container
        .querySelector<HTMLButtonElement>('[data-testid="complete-custom-register"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetchJsonMock).toHaveBeenCalledWith(
      "/api/admin/integration-requests/req-custom/add",
      { method: "POST" },
    );
  });
});
