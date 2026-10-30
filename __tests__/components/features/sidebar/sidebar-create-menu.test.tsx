import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CanvasExtensionsService from "#/api/canvas-extensions-service";
import {
  setActiveSelection,
  setRegisteredBackends,
} from "#/api/backend-registry/active-store";
import type { Backend } from "#/api/backend-registry/types";
import { CanvasExtensionsRuntimeProvider } from "#/components/features/canvas-extensions/canvas-extensions-runtime";
import { SidebarCreateMenu } from "#/components/features/sidebar/sidebar-create-menu";
import { NavigationProvider } from "#/context/navigation-context";
import { ActiveBackendProvider } from "#/contexts/active-backend-context";
import {
  peekCanvasExtensionIntent,
  resetCanvasExtensionIntents,
} from "#/stores/canvas-extension-intent-store";
import type {
  CanvasExtensionHost,
  InstalledCanvasExtensionInfo,
} from "#/types/canvas-extension";

const backend: Backend = {
  id: "menu-backend",
  name: "Menu backend",
  host: "http://127.0.0.1:8000",
  apiKey: "test-key",
  kind: "local",
};

const docTransit: InstalledCanvasExtensionInfo = {
  name: "doctransit",
  version: "0.1.0",
  enabled: true,
  source: "github:example/doctransit",
  installed_at: "2026-08-01T00:00:00Z",
  install_path: "/tmp/doctransit",
  manifest: {
    schema_version: 1,
    name: "doctransit",
    version: "0.1.0",
    entrypoint: "dist/extension.js",
    contributes: {
      pages: [{ id: "editor", title: "Editor", path: "/editor" }],
    },
  },
};

const ICON_SVG =
  '<svg viewBox="0 0 16 16"><script>window.__pwned = true</script><path fill="currentColor" d="M0 0h16v16z"/></svg>';

function renderMenu(
  activate: (host: CanvasExtensionHost) => void,
  navigate = vi.fn(),
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const moduleLoader = vi.fn().mockResolvedValue({ activate });
  render(
    <QueryClientProvider client={queryClient}>
      <ActiveBackendProvider>
        <MemoryRouter>
          <NavigationProvider
            value={{
              currentPath: "/",
              conversationId: null,
              isNavigating: false,
              navigate,
            }}
          >
            <CanvasExtensionsRuntimeProvider moduleLoader={moduleLoader}>
              <SidebarCreateMenu />
            </CanvasExtensionsRuntimeProvider>
          </NavigationProvider>
        </MemoryRouter>
      </ActiveBackendProvider>
    </QueryClientProvider>,
  );
  return { navigate };
}

describe("SidebarCreateMenu", () => {
  beforeEach(() => {
    setRegisteredBackends([backend]);
    setActiveSelection({ backendId: backend.id });
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      docTransit,
    ]);
    vi.spyOn(CanvasExtensionsService, "fetchBundle").mockResolvedValue("src");
    vi.spyOn(
      CanvasExtensionsService,
      "createAppBackendViewClient",
    ).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetCanvasExtensionIntents();
    setActiveSelection(null);
    setRegisteredBackends([]);
  });

  it("lists the built-ins, each with an icon and a destination, before extensions load", async () => {
    const user = userEvent.setup();
    renderMenu(() => undefined);

    await user.click(screen.getByTestId("sidebar-create-menu-trigger"));

    const links = within(
      screen.getByTestId("sidebar-create-menu"),
    ).getAllByRole("link");
    expect(links).toHaveLength(6);
    links.forEach((link) => {
      expect(link.querySelector("svg")).not.toBeNull();
      expect(link).toHaveAttribute("href");
    });
    expect(screen.getByTestId("sidebar-create-factory")).toHaveAttribute(
      "href",
      expect.stringContaining("/factory?new=1"),
    );
    expect(screen.queryByRole("separator")).not.toBeInTheDocument();
  });

  it("appends extension entries under a divider and opens the page with the intent", async () => {
    const user = userEvent.setup();
    const { navigate } = renderMenu((host) => {
      host.registerCreateAction({
        id: "new-document",
        label: "New document",
        description: "Start a blank document",
        icon: { svg: ICON_SVG },
        pageId: "editor",
        intent: "create:document",
      });
      host.registerCreateAction({
        id: "new-contract",
        label: "New contract",
        pageId: "editor",
      });
    });
    await user.click(screen.getByTestId("sidebar-create-menu-trigger"));

    const document = await screen.findByTestId(
      "sidebar-create-extension-doctransit-new-document",
    );
    expect(screen.getByRole("separator")).toBeInTheDocument();
    expect(document).toHaveTextContent("New document");
    expect(document).toHaveAttribute("title", "Start a blank document");
    expect(
      screen.getByTestId("sidebar-create-extension-doctransit-new-contract"),
    ).toHaveTextContent("New contract");

    await user.click(document);

    expect(navigate).toHaveBeenCalledWith(
      expect.stringContaining("/extensions/doctransit/editor"),
      expect.anything(),
    );
    expect(peekCanvasExtensionIntent("doctransit", "editor")).toEqual({
      id: "new-document",
      action: "create:document",
      at: expect.any(Number),
    });
    expect(screen.queryByTestId("sidebar-create-menu")).not.toBeInTheDocument();
  });

  it("renders extension SVG as an inert mask, never as markup", async () => {
    const user = userEvent.setup();
    renderMenu((host) => {
      host.registerCreateAction({
        id: "new-document",
        label: "New document",
        icon: { svg: ICON_SVG },
        pageId: "editor",
      });
    });
    await user.click(screen.getByTestId("sidebar-create-menu-trigger"));

    const row = await screen.findByTestId(
      "sidebar-create-extension-doctransit-new-document",
    );
    const icon = within(row).getByTestId("sidebar-create-extension-svg-icon");

    expect(row.querySelector("script, svg, img")).toBeNull();
    expect(icon.children).toHaveLength(0);
    expect(
      icon.style.getPropertyValue("--canvas-extension-create-icon"),
    ).toContain("data:image/svg+xml");
    expect(
      (window as unknown as { __pwned?: boolean }).__pwned,
    ).toBeUndefined();
  });

  it("falls back to the extension icon when the action has none", async () => {
    const user = userEvent.setup();
    renderMenu((host) => {
      host.registerCreateAction({
        id: "new-contract",
        label: "New contract",
        pageId: "editor",
      });
    });
    await user.click(screen.getByTestId("sidebar-create-menu-trigger"));

    const row = await screen.findByTestId(
      "sidebar-create-extension-doctransit-new-contract",
    );

    await waitFor(() => expect(row.querySelector("svg")).not.toBeNull());
    expect(
      within(row).queryByTestId("sidebar-create-extension-svg-icon"),
    ).not.toBeInTheDocument();
  });
});
