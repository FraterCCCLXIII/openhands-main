import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
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
import { ActiveBackendProvider } from "#/contexts/active-backend-context";
import type { InstalledCanvasExtensionInfo } from "#/types/canvas-extension";
import { HOME_APP_PROMO_DISMISSED_STORAGE_KEY } from "#/components/features/home/home-app-promo.constants";
import { HomeAppPromoCard } from "#/components/features/home/home-app-promo-card";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { resolvedLanguage: "en" },
  }),
}));

const backend: Backend = {
  id: "promo-backend",
  name: "Promo backend",
  host: "http://127.0.0.1:8000",
  apiKey: "test-key",
  kind: "local",
};

const mobileExtension = (enabled: boolean): InstalledCanvasExtensionInfo => ({
  name: "mobile",
  version: "0.1.0",
  enabled,
  source: "github:example/mobile",
  resolved_ref: "abc123",
  installed_at: "2026-08-01T00:00:00Z",
  install_path: "/tmp/mobile",
  manifest: {
    schema_version: 1,
    name: "mobile",
    display_name: "Mobile",
    version: "0.1.0",
    entrypoint: "extension.js",
    contributes: {
      pages: [{ id: "mobile", title: "Mobile app", path: "/mobile" }],
    },
  },
});

function renderCard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const moduleLoader = vi.fn().mockResolvedValue({
    activate: (host: { registerPage: (id: string, m: () => void) => void }) => {
      host.registerPage("mobile", () => undefined);
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ActiveBackendProvider>
        <MemoryRouter>
          <CanvasExtensionsRuntimeProvider moduleLoader={moduleLoader}>
            <HomeAppPromoCard />
          </CanvasExtensionsRuntimeProvider>
        </MemoryRouter>
      </ActiveBackendProvider>
    </QueryClientProvider>,
  );
}

describe("HomeAppPromoCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
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

  it("stays hidden while the extension list is loading", async () => {
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockReturnValue(
      new Promise(() => undefined),
    );
    renderCard();
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    expect(screen.queryByTestId("home-app-promo")).not.toBeInTheDocument();
  });

  it("stays hidden when the mobile extension is not installed", async () => {
    const list = vi
      .spyOn(CanvasExtensionsService, "listInstalled")
      .mockResolvedValue([]);
    renderCard();
    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(screen.queryByTestId("home-app-promo")).not.toBeInTheDocument();
  });

  it("stays hidden when the mobile extension is installed but disabled", async () => {
    const list = vi
      .spyOn(CanvasExtensionsService, "listInstalled")
      .mockResolvedValue([mobileExtension(false)]);
    renderCard();
    await waitFor(() => expect(list).toHaveBeenCalled());
    expect(screen.queryByTestId("home-app-promo")).not.toBeInTheDocument();
  });

  it("links to the extension page when the mobile extension is enabled", async () => {
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      mobileExtension(true),
    ]);
    renderCard();
    expect(await screen.findByTestId("home-app-promo")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "HOME$PHONE_APP_GET_APP" }),
    ).toHaveAttribute("href", "/extensions/mobile/mobile");
  });

  it("stays hidden once dismissed", async () => {
    window.localStorage.setItem(HOME_APP_PROMO_DISMISSED_STORAGE_KEY, "true");
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      mobileExtension(true),
    ]);
    renderCard();
    await waitFor(() =>
      expect(CanvasExtensionsService.fetchBundle).toHaveBeenCalled(),
    );
    expect(screen.queryByTestId("home-app-promo")).not.toBeInTheDocument();
  });

  it("remembers dismissal", async () => {
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      mobileExtension(true),
    ]);
    renderCard();
    await userEvent.click(
      await screen.findByRole("button", {
        name: "HOME$PHONE_APP_DISMISS_LABEL",
      }),
    );
    expect(screen.queryByTestId("home-app-promo")).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem(HOME_APP_PROMO_DISMISSED_STORAGE_KEY),
    ).toBe("true");
  });
});
