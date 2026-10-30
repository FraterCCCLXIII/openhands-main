import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CanvasExtensionsService from "#/api/canvas-extensions-service";
import {
  setActiveSelection,
  setRegisteredBackends,
} from "#/api/backend-registry/active-store";
import type { Backend } from "#/api/backend-registry/types";
import { ActiveBackendProvider } from "#/contexts/active-backend-context";
import type {
  CanvasExtensionHost,
  InstalledCanvasExtensionInfo,
} from "#/types/canvas-extension";
import {
  CanvasExtensionsRuntimeProvider,
  useCanvasExtensionsRuntime,
} from "./canvas-extensions-runtime";
import {
  dispatchCanvasExtensionIntent,
  markCanvasExtensionPageMounted,
  resetCanvasExtensionIntents,
} from "#/stores/canvas-extension-intent-store";

const backend: Backend = {
  id: "extension-backend",
  name: "Extension backend",
  host: "http://127.0.0.1:8000",
  apiKey: "test-key",
  kind: "local",
};

const extension: InstalledCanvasExtensionInfo = {
  name: "demo-extension",
  version: "0.1.0",
  enabled: true,
  source: "github:example/demo",
  resolved_ref: "abc123",
  installed_at: "2026-08-01T00:00:00Z",
  install_path: "/tmp/demo-extension",
  manifest: {
    schema_version: 1,
    name: "demo-extension",
    display_name: "Demo extension",
    version: "0.1.0",
    entrypoint: "dist/extension.js",
    contributes: {
      pages: [
        {
          id: "dashboard",
          title: "Dashboard",
          path: "/dashboard",
          nav_label: "Demo dashboard",
        },
      ],
    },
  },
};

function RuntimeProbe() {
  const runtime = useCanvasExtensionsRuntime();
  return (
    <div>
      <span data-testid="page-count">{runtime.pages.length}</span>
      <span data-testid="page-href">{runtime.pages[0]?.href}</span>
      <span data-testid="create-actions">
        {runtime.createActions
          .map(
            (entry) =>
              `${entry.extension.name}:${entry.action.id}:${entry.href}`,
          )
          .join("|")}
      </span>
      <span data-testid="runtime-error">
        {runtime.errors.get(extension.name)}
      </span>
    </div>
  );
}

function renderRuntime(
  moduleLoader: (source: string) => Promise<{
    activate: (host: CanvasExtensionHost) => void | (() => void);
  }>,
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rendered = render(
    <QueryClientProvider client={queryClient}>
      <ActiveBackendProvider>
        <MemoryRouter>
          <CanvasExtensionsRuntimeProvider moduleLoader={moduleLoader}>
            <RuntimeProbe />
          </CanvasExtensionsRuntimeProvider>
        </MemoryRouter>
      </ActiveBackendProvider>
    </QueryClientProvider>,
  );
  return { ...rendered, queryClient };
}

describe("CanvasExtensionsRuntimeProvider", () => {
  beforeEach(() => {
    setRegisteredBackends([backend]);
    setActiveSelection({ backendId: backend.id });
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      extension,
    ]);
    vi.spyOn(CanvasExtensionsService, "fetchBundle").mockResolvedValue(
      "fixture source",
    );
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

  it("activates enabled extensions and admits declared page registrations", async () => {
    const disposeActivation = vi.fn();
    const moduleLoader = vi.fn().mockResolvedValue({
      activate: (host: CanvasExtensionHost) => {
        host.registerPage("dashboard", () => undefined);
        return disposeActivation;
      },
    });

    const rendered = renderRuntime(moduleLoader);

    await waitFor(() =>
      expect(screen.getByTestId("page-count")).toHaveTextContent("1"),
    );
    expect(screen.getByTestId("page-href")).toHaveTextContent(
      "/extensions/demo-extension/dashboard",
    );
    expect(CanvasExtensionsService.fetchBundle).toHaveBeenCalledWith(
      extension.name,
      expect.objectContaining({ id: backend.id }),
    );

    rendered.unmount();
    expect(disposeActivation).toHaveBeenCalledTimes(1);
  });

  it("re-activates an extension refreshed without a version change", async () => {
    const disposeActivation = vi.fn();
    const moduleLoader = vi.fn().mockResolvedValue({
      activate: () => disposeActivation,
    });

    const { queryClient } = renderRuntime(moduleLoader);
    await waitFor(() => expect(moduleLoader).toHaveBeenCalledTimes(1));

    vi.mocked(CanvasExtensionsService.listInstalled).mockResolvedValue([
      { ...extension, installed_at: "2026-08-02T00:00:00Z" },
    ]);
    await queryClient.invalidateQueries();

    await waitFor(() => expect(moduleLoader).toHaveBeenCalledTimes(2));
    expect(disposeActivation).toHaveBeenCalledTimes(1);
  });

  it("rejects registrations that were not declared in the manifest", async () => {
    const moduleLoader = vi.fn().mockResolvedValue({
      activate: (host: CanvasExtensionHost) => {
        host.registerPage("surprise", () => undefined);
      },
    });

    renderRuntime(moduleLoader);

    await waitFor(() =>
      expect(screen.getByTestId("runtime-error")).toHaveTextContent(
        'registered undeclared page "surprise"',
      ),
    );
    expect(screen.getByTestId("page-count")).toHaveTextContent("0");
  });

  it("degrades gracefully when the backend response has no manifest", async () => {
    vi.mocked(CanvasExtensionsService.listInstalled).mockResolvedValue([
      { ...extension, manifest: null },
    ]);
    const moduleLoader = vi.fn().mockResolvedValue({
      activate: (host: CanvasExtensionHost) => {
        host.registerPage("dashboard", () => undefined);
      },
    });

    renderRuntime(moduleLoader);

    await waitFor(() =>
      expect(screen.getByTestId("runtime-error")).toHaveTextContent(
        'registered undeclared page "dashboard"',
      ),
    );
    expect(screen.getByTestId("page-count")).toHaveTextContent("0");
  });

  it("revokes mounted app views when the selected backend changes", async () => {
    const secondBackend: Backend = {
      ...backend,
      id: "second-extension-backend",
      name: "Second extension backend",
      host: "http://127.0.0.1:8001",
    };
    setRegisteredBackends([backend, secondBackend]);
    const createSession = vi.fn().mockResolvedValue({
      url: "https://apps.example.test/app-backends/demo-extension/",
      expiresAt: "2026-09-23T16:00:00Z",
      iframeSandbox:
        "allow-forms allow-modals allow-popups allow-same-origin allow-scripts",
    });
    const revokeSession = vi.fn().mockResolvedValue(undefined);
    const disposeClient = vi.fn();
    vi.mocked(
      CanvasExtensionsService.createAppBackendViewClient,
    ).mockResolvedValue({
      createSession,
      revokeSession,
      dispose: disposeClient,
    });
    const viewContainer = document.createElement("div");
    const moduleLoader = vi.fn().mockResolvedValue({
      activate: (host: CanvasExtensionHost) => {
        host.appBackendView?.mount({ container: viewContainer });
        host.registerPage("dashboard", () => undefined);
      },
    });

    const rendered = renderRuntime(moduleLoader);

    await waitFor(() => expect(createSession).toHaveBeenCalledTimes(1));
    expect(viewContainer.querySelector("iframe")).not.toBeNull();

    setActiveSelection({ backendId: secondBackend.id });

    await waitFor(() => expect(revokeSession).toHaveBeenCalledTimes(1));
    expect(disposeClient).toHaveBeenCalledTimes(1);
    rendered.unmount();
  });

  it("disposes registrations from the previous backend before activating the next", async () => {
    const secondBackend: Backend = {
      ...backend,
      id: "second-extension-backend",
      name: "Second extension backend",
      host: "http://127.0.0.1:8001",
    };
    setRegisteredBackends([backend, secondBackend]);
    const disposeFirst = vi.fn();
    const disposeSecond = vi.fn();
    const moduleLoader = vi.fn().mockResolvedValue({
      activate: (host: CanvasExtensionHost) => {
        host.registerPage("dashboard", () => undefined);
        return host.backend.id === backend.id ? disposeFirst : disposeSecond;
      },
    });

    const rendered = renderRuntime(moduleLoader);
    await waitFor(() =>
      expect(screen.getByTestId("page-count")).toHaveTextContent("1"),
    );

    setActiveSelection({ backendId: secondBackend.id });

    await waitFor(() => expect(disposeFirst).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(CanvasExtensionsService.fetchBundle).toHaveBeenLastCalledWith(
        extension.name,
        expect.objectContaining({ id: secondBackend.id }),
      ),
    );
    expect(disposeSecond).not.toHaveBeenCalled();

    rendered.unmount();
    expect(disposeSecond).toHaveBeenCalledTimes(1);
  });

  describe("create actions", () => {
    afterEach(() => resetCanvasExtensionIntents());

    it("publishes valid create actions with the page href", async () => {
      const moduleLoader = vi.fn().mockResolvedValue({
        activate: (host: CanvasExtensionHost) => {
          host.registerCreateAction({
            id: "new-document",
            label: "New document",
            icon: { svg: '<svg viewBox="0 0 1 1"><path d="M0 0h1v1z"/></svg>' },
            pageId: "dashboard",
            intent: "create:document",
          });
        },
      });

      renderRuntime(moduleLoader);

      await waitFor(() =>
        expect(screen.getByTestId("create-actions")).toHaveTextContent(
          "demo-extension:new-document:/extensions/demo-extension/dashboard",
        ),
      );
    });

    it("rejects invalid registrations without breaking valid ones", async () => {
      const failures: string[] = [];
      const attempt = (host: CanvasExtensionHost, action: object) => {
        try {
          host.registerCreateAction(
            action as Parameters<
              CanvasExtensionHost["registerCreateAction"]
            >[0],
          );
        } catch (error) {
          failures.push((error as Error).message);
        }
      };
      const moduleLoader = vi.fn().mockResolvedValue({
        activate: (host: CanvasExtensionHost) => {
          attempt(host, { id: "Bad Id", label: "Ok", pageId: "dashboard" });
          attempt(host, { id: "empty-label", label: " ", pageId: "dashboard" });
          attempt(host, { id: "no-page", label: "Ok", pageId: "missing" });
          attempt(host, {
            id: "huge-icon",
            label: "Ok",
            pageId: "dashboard",
            icon: { svg: `<svg>${"a".repeat(5000)}</svg>` },
          });
          attempt(host, {
            id: "not-svg",
            label: "Ok",
            pageId: "dashboard",
            icon: { svg: "<img src=x onerror=alert(1)>" },
          });
          attempt(host, { id: "good", label: "Good", pageId: "dashboard" });
          attempt(host, { id: "good", label: "Again", pageId: "dashboard" });
        },
      });

      renderRuntime(moduleLoader);

      await waitFor(() =>
        expect(screen.getByTestId("create-actions")).toHaveTextContent(
          "demo-extension:good:",
        ),
      );
      expect(screen.getByTestId("create-actions").textContent).not.toContain(
        "|",
      );
      expect(failures).toEqual([
        expect.stringContaining("id must use lowercase"),
        expect.stringContaining("label must be 1-40"),
        expect.stringContaining('undeclared page "missing"'),
        expect.stringContaining("icon.svg must be inline <svg>"),
        expect.stringContaining("icon.svg must be inline <svg>"),
        expect.stringContaining('create action "good" more than once'),
      ]);
      expect(screen.getByTestId("runtime-error")).toBeEmptyDOMElement();
    });

    it("orders actions by extension name, then registration order", async () => {
      const zeta: InstalledCanvasExtensionInfo = {
        ...extension,
        name: "zeta-extension",
        manifest: { ...extension.manifest!, name: "zeta-extension" },
      };
      vi.mocked(CanvasExtensionsService.listInstalled).mockResolvedValue([
        zeta,
        extension,
      ]);
      const moduleLoader = vi.fn().mockResolvedValue({
        activate: (host: CanvasExtensionHost) => {
          host.registerCreateAction({
            id: "b",
            label: "B",
            pageId: "dashboard",
          });
          host.registerCreateAction({
            id: "a",
            label: "A",
            pageId: "dashboard",
          });
        },
      });

      renderRuntime(moduleLoader);

      await waitFor(() =>
        expect(
          screen.getByTestId("create-actions").textContent?.split("|"),
        ).toEqual([
          "demo-extension:b:/extensions/demo-extension/dashboard",
          "demo-extension:a:/extensions/demo-extension/dashboard",
          "zeta-extension:b:/extensions/zeta-extension/dashboard",
          "zeta-extension:a:/extensions/zeta-extension/dashboard",
        ]),
      );
    });

    it("removes an action when it is disposed", async () => {
      let disposeNew: (() => void) | undefined;
      const moduleLoader = vi.fn().mockResolvedValue({
        activate: (host: CanvasExtensionHost) => {
          disposeNew = host.registerCreateAction({
            id: "new-thing",
            label: "New thing",
            pageId: "dashboard",
          });
        },
      });
      renderRuntime(moduleLoader);
      await waitFor(() =>
        expect(screen.getByTestId("create-actions")).toHaveTextContent(
          "new-thing",
        ),
      );

      act(() => disposeNew?.());

      expect(screen.getByTestId("create-actions")).toBeEmptyDOMElement();
    });

    it("removes actions when the extension is disabled", async () => {
      const moduleLoader = vi.fn().mockResolvedValue({
        activate: (host: CanvasExtensionHost) => {
          host.registerCreateAction({
            id: "new-thing",
            label: "New thing",
            pageId: "dashboard",
          });
        },
      });
      const { queryClient } = renderRuntime(moduleLoader);
      await waitFor(() =>
        expect(screen.getByTestId("create-actions")).toHaveTextContent(
          "new-thing",
        ),
      );

      vi.mocked(CanvasExtensionsService.listInstalled).mockResolvedValue([
        { ...extension, enabled: false },
      ]);
      await queryClient.invalidateQueries();

      await waitFor(() =>
        expect(screen.getByTestId("create-actions")).toBeEmptyDOMElement(),
      );
    });

    it("delivers intents to onIntent only while the extension is active", async () => {
      const received = vi.fn();
      const moduleLoader = vi.fn().mockResolvedValue({
        activate: (host: CanvasExtensionHost) => {
          host.onIntent(received);
        },
      });
      const rendered = renderRuntime(moduleLoader);
      await waitFor(() => expect(moduleLoader).toHaveBeenCalled());
      await waitFor(() =>
        expect(screen.getByTestId("page-count")).toBeInTheDocument(),
      );
      const unmarkMounted = markCanvasExtensionPageMounted(
        extension.name,
        "dashboard",
      );

      dispatchCanvasExtensionIntent(extension.name, "dashboard", {
        id: "new-document",
        action: "create:document",
      });
      expect(received).toHaveBeenCalledWith({
        id: "new-document",
        action: "create:document",
        at: expect.any(Number),
      });

      rendered.unmount();
      dispatchCanvasExtensionIntent(extension.name, "dashboard", {
        id: "new-document",
        action: "create:document",
      });
      expect(received).toHaveBeenCalledTimes(1);
      unmarkMounted();
    });
  });
});
