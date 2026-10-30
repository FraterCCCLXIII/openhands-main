import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CanvasExtensionsService from "#/api/canvas-extensions-service";
import {
  setActiveSelection,
  setRegisteredBackends,
} from "#/api/backend-registry/active-store";
import type { Backend } from "#/api/backend-registry/types";
import { CanvasExtensionsRuntimeProvider } from "#/components/features/canvas-extensions/canvas-extensions-runtime";
import { NavigationProvider } from "#/context/navigation-context";
import { ActiveBackendProvider } from "#/contexts/active-backend-context";
import translations from "#/i18n/translation.json";
import CanvasExtensionPage from "#/routes/canvas-extension-page";
import KanbanRoute from "#/routes/kanban";
import type { InstalledCanvasExtensionInfo } from "#/types/canvas-extension";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) =>
      (
        (translations as Record<string, { en: string }>)[key]?.en ?? key
      ).replace(/\{\{(\w+)\}\}/g, (_, name) => values?.[name] ?? ""),
    i18n: { language: "en", exists: () => false },
  }),
}));

const backend: Backend = {
  id: "guard-backend",
  name: "Guard backend",
  host: "http://127.0.0.1:8000",
  apiKey: "test-key",
  kind: "local",
};

const kanban = (enabled: boolean): InstalledCanvasExtensionInfo => ({
  name: "kanban",
  version: "0.1.0",
  enabled,
  source: "github:example/kanban",
  installed_at: "2026-08-01T00:00:00Z",
  install_path: "/tmp/kanban",
  manifest: {
    schema_version: 1,
    name: "kanban",
    display_name: "Kanban",
    version: "0.1.0",
    entrypoint: "extension.js",
    contributes: {
      pages: [{ id: "board", title: "Kanban", path: "/board" }],
    },
  },
});

function renderRoutes(path: string) {
  const moduleLoader = vi.fn().mockResolvedValue({
    activate: (host: { registerPage: (id: string, mount: unknown) => void }) =>
      host.registerPage(
        "board",
        ({ container }: { container: HTMLElement }) => {
          container.append("kanban board mounted");
        },
      ),
  });
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <ActiveBackendProvider>
        <MemoryRouter initialEntries={[path]}>
          <NavigationProvider
            value={{
              currentPath: path,
              conversationId: null,
              isNavigating: false,
              navigate: vi.fn(),
            }}
          >
            <CanvasExtensionsRuntimeProvider moduleLoader={moduleLoader}>
              <Routes>
                <Route path="kanban" element={<KanbanRoute />} />
                <Route
                  path="extensions/:extensionName/*"
                  element={<CanvasExtensionPage />}
                />
              </Routes>
            </CanvasExtensionsRuntimeProvider>
          </NavigationProvider>
        </MemoryRouter>
      </ActiveBackendProvider>
    </QueryClientProvider>,
  );
}

describe("extension page guard", () => {
  beforeEach(() => {
    setRegisteredBackends([backend]);
    setActiveSelection({ backendId: backend.id });
    vi.spyOn(CanvasExtensionsService, "fetchBundle").mockResolvedValue("src");
    vi.spyOn(
      CanvasExtensionsService,
      "createAppBackendViewClient",
    ).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setActiveSelection(null);
    setRegisteredBackends([]);
  });

  it("says an installed but disabled app is turned off, with a link to Apps", async () => {
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      kanban(false),
    ]);
    renderRoutes("/extensions/kanban/board");

    expect(
      await screen.findByRole("heading", { name: "Kanban is turned off" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open Customize > Apps" }),
    ).toHaveAttribute("href", "/apps");
  });

  it("says an app that is not installed is not installed", async () => {
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([]);
    renderRoutes("/extensions/kanban/board");

    expect(
      await screen.findByRole("heading", { name: "kanban is not installed" }),
    ).toBeInTheDocument();
  });

  it("mounts the page of an enabled app", async () => {
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      kanban(true),
    ]);
    renderRoutes("/extensions/kanban/board");

    expect(await screen.findByText("kanban board mounted")).toBeInTheDocument();
  });

  describe("legacy /kanban route", () => {
    it("forwards to the Kanban app when it is enabled", async () => {
      vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
        kanban(true),
      ]);
      renderRoutes("/kanban");

      expect(
        await screen.findByText("kanban board mounted"),
      ).toBeInTheDocument();
    });

    it("explains when the Kanban app is off or missing instead of forwarding", async () => {
      const list = vi
        .spyOn(CanvasExtensionsService, "listInstalled")
        .mockResolvedValue([kanban(false)]);
      renderRoutes("/kanban");

      expect(
        await screen.findByRole("heading", { name: "Kanban is turned off" }),
      ).toBeInTheDocument();
      list.mockRestore();
    });
  });
});
