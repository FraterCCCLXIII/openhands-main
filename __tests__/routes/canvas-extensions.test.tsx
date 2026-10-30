import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CanvasExtensionsScreen from "#/routes/canvas-extensions";
import CanvasExtensionsService from "#/api/canvas-extensions-service";
import SettingsService from "#/api/settings-service/settings-service.api";
import {
  __resetActiveStoreForTests,
  setActiveSelection,
  setRegisteredBackends,
} from "#/api/backend-registry/active-store";
import type { Backend } from "#/api/backend-registry/types";
import { MOCK_DEFAULT_USER_SETTINGS } from "#/mocks/handlers";
import { ActiveBackendProvider } from "#/contexts/active-backend-context";
import type { InstalledCanvasExtensionInfo } from "#/types/canvas-extension";

// Render the real English copy so the tests read like the UI.
vi.mock("react-i18next", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-i18next")>();
  const translations = (await import("#/i18n/translation.json"))
    .default as Record<string, { en: string }>;
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, vars?: Record<string, string>) =>
        (translations[key]?.en ?? key).replace(
          /\{\{(\w+)\}\}/g,
          (_m, name) => vars?.[name] ?? "",
        ),
      i18n: { language: "en", exists: () => true },
    }),
  };
});

const navigateMock = vi.hoisted(() => vi.fn());
const mockPath = "/apps";
vi.mock("#/context/navigation-context", () => ({
  useNavigation: () => ({
    navigate: navigateMock,
    currentPath: mockPath,
    conversationId: null,
    isNavigating: false,
  }),
  NavigationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const localBackend: Backend = {
  id: "local",
  name: "Local",
  host: "http://127.0.0.1:8001",
  apiKey: "",
  kind: "local",
};

function buildExtension(
  overrides: Partial<InstalledCanvasExtensionInfo> = {},
): InstalledCanvasExtensionInfo {
  return {
    name: "demo-page",
    version: "0.1.0",
    enabled: true,
    source: "https://github.com/OpenHands/OpenHands",
    repo_path: "src/fixtures/canvas-extensions/demo-page",
    installed_at: "2026-10-01T00:00:00Z",
    install_path: "/home/.openhands/canvas-extensions/installed/demo-page",
    ...overrides,
  };
}

const KNOWN_APPS = {
  apps: [
    {
      name: "free-game",
      display_name: "Free Game",
      kind: "canvas-app",
      category: "games",
      license: "MIT",
      pricing: { model: "free" },
      description: "A free game",
    },
    {
      name: "paid-docs",
      display_name: "Paid Docs",
      kind: "canvas-app",
      category: "docs",
      license: "LicenseRef-Proprietary",
      pricing: {
        model: "subscription",
        amount: 10,
        period: "month",
        sample: true,
      },
    },
    {
      name: "once-chat",
      display_name: "Once Chat",
      kind: "canvas-app",
      category: "social",
      license: "GPL-3.0-only",
      pricing: { model: "one-time", amount: 5, sample: true },
    },
    {
      name: "mystery",
      display_name: "Mystery",
      kind: "canvas-app",
      category: "docs",
    },
    { name: "a-product", display_name: "A Product", kind: "product" },
  ],
};

function renderAppsScreen(initialEntry = "/apps") {
  return render(<CanvasExtensionsScreen />, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[initialEntry]}>
        <QueryClientProvider
          client={
            new QueryClient({ defaultOptions: { queries: { retry: false } } })
          }
        >
          <ActiveBackendProvider>{children}</ActiveBackendProvider>
        </QueryClientProvider>
      </MemoryRouter>
    ),
  });
}

/** Starts an Update whose install request stays pending until resolved. */
async function startPendingUpdate(user: ReturnType<typeof userEvent.setup>) {
  let finishUpdate: () => void = () => {};
  vi.spyOn(CanvasExtensionsService, "install").mockImplementation(
    () =>
      new Promise((resolve) => {
        finishUpdate = () => resolve(buildExtension());
      }),
  );
  await user.click(
    await screen.findByTestId("canvas-extension-menu-demo-page"),
  );
  await user.click(
    await screen.findByTestId("canvas-extension-refresh-demo-page"),
  );
  // The menu closes on pick; reopen it to see that Uninstall waits for the update.
  await user.click(screen.getByTestId("canvas-extension-menu-demo-page"));
  await waitFor(() =>
    expect(
      screen.getByTestId("canvas-extension-uninstall-demo-page"),
    ).toBeDisabled(),
  );
  await user.keyboard("{Escape}");
  return () => finishUpdate();
}

describe("CanvasExtensionsScreen", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    __resetActiveStoreForTests();
    setRegisteredBackends([localBackend]);
    setActiveSelection({ backendId: localBackend.id });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(KNOWN_APPS))),
    );
    vi.spyOn(SettingsService, "getSettings").mockResolvedValue(
      MOCK_DEFAULT_USER_SETTINGS,
    );
  });

  // Issue #17956: the switch was only styled inert while busy, so the
  // keyboard could still disable an app in the middle of an Update.
  it("keeps an enabled app's switch inert to the keyboard while an Update is pending", async () => {
    const user = userEvent.setup();
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      buildExtension({ enabled: true }),
    ]);
    const setEnabledSpy = vi
      .spyOn(CanvasExtensionsService, "setEnabled")
      .mockResolvedValue(buildExtension({ enabled: false }));
    renderAppsScreen();

    const finishUpdate = await startPendingUpdate(user);
    const appSwitch = screen.getByRole("switch");
    expect(appSwitch).toBeDisabled();
    appSwitch.focus();
    expect(appSwitch).not.toHaveFocus();
    await user.keyboard(" ");
    expect(setEnabledSpy).not.toHaveBeenCalled();

    finishUpdate();
    await waitFor(() => expect(appSwitch).toBeEnabled());
    appSwitch.focus();
    await user.keyboard(" ");
    await waitFor(() =>
      expect(setEnabledSpy).toHaveBeenCalledWith("demo-page", false),
    );
  });

  it("does not open the enable confirmation from a disabled app's switch while an Update is pending", async () => {
    const user = userEvent.setup();
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      buildExtension({ enabled: false }),
    ]);
    renderAppsScreen();

    const finishUpdate = await startPendingUpdate(user);
    const appSwitch = screen.getByRole("switch");
    appSwitch.focus();
    await user.keyboard(" ");
    expect(screen.queryByTestId("confirmation-modal")).not.toBeInTheDocument();

    finishUpdate();
    await waitFor(() => expect(appSwitch).toBeEnabled());
    appSwitch.focus();
    await user.keyboard(" ");
    expect(screen.getByTestId("confirmation-modal")).toBeInTheDocument();
  });

  const cardOrder = (prefix: string) =>
    screen
      .getAllByRole("heading", { level: 3 })
      .map((h) => h.textContent)
      .filter((n) => n?.startsWith(prefix));

  it("sorts, filters by status and searches the installed apps from the rail", async () => {
    const user = userEvent.setup();
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      buildExtension({
        name: "bravo",
        enabled: false,
        installed_at: "2026-01-02T00:00:00Z",
      }),
      buildExtension({
        name: "alpha",
        enabled: false,
        installed_at: "2026-01-01T00:00:00Z",
      }),
      buildExtension({
        name: "charlie",
        enabled: true,
        installed_at: "2026-01-03T00:00:00Z",
      }),
    ]);
    renderAppsScreen();
    await screen.findByText("alpha");
    const names = () =>
      cardOrder("").filter((n) =>
        ["alpha", "bravo", "charlie"].includes(n ?? ""),
      );
    expect(names()).toEqual(["alpha", "bravo", "charlie"]);

    await user.click(screen.getByLabelText("Enabled first"));
    expect(names()).toEqual(["charlie", "alpha", "bravo"]);
    await user.click(screen.getByLabelText("Newest first"));
    expect(names()).toEqual(["charlie", "bravo", "alpha"]);

    const status = screen.getByRole("group", { name: "Status" });
    expect(
      within(status)
        .getByLabelText(/^Enabled/)
        .closest("label"),
    ).toHaveTextContent("1");
    expect(
      within(status)
        .getByLabelText(/^Disabled/)
        .closest("label"),
    ).toHaveTextContent("2");
    await user.click(within(status).getByLabelText(/^Disabled/));
    expect(names()).toEqual(["bravo", "alpha"]);
    expect(
      within(status).getByText("1", { selector: "span" }),
    ).toBeInTheDocument();

    await user.type(screen.getByTestId("apps-search"), "alp");
    expect(names()).toEqual(["alpha"]);
    await user.click(screen.getByTestId("apps-clear-filters"));
    expect(names()).toEqual(["alpha", "bravo", "charlie"]);
  });

  it("restores sort and filters from the URL", async () => {
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      buildExtension({ name: "alpha", enabled: false }),
      buildExtension({ name: "bravo", enabled: true }),
    ]);
    renderAppsScreen("/apps?status=enabled&sort=newest&q=br");
    await screen.findByText("bravo");
    expect(screen.queryByText("alpha")).not.toBeInTheDocument();
    expect(screen.getByTestId("apps-search")).toHaveValue("br");
    expect(screen.getByLabelText("Newest first")).toBeChecked();
  });

  it("lists not-installed catalog apps in the App Store and filters by category, price and license with counts", async () => {
    const user = userEvent.setup();
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([
      buildExtension({ name: "free-game" }),
    ]);
    renderAppsScreen("/apps?view=store");
    await screen.findByTestId("app-store-card-paid-docs");
    expect(
      screen.queryByTestId("app-store-card-a-product"),
    ).not.toBeInTheDocument();
    const notInstalled = screen.getByLabelText(/^Not installed/);
    expect(notInstalled.closest("label")).toHaveTextContent("3");

    const category = screen.getByRole("group", { name: "Category" });
    expect(
      within(category.closest("fieldset") as HTMLElement)
        .getByLabelText(/^Docs/)
        .closest("label"),
    ).toHaveTextContent("2");
    await user.click(within(category).getByLabelText(/^Docs/));
    expect(
      screen.queryByTestId("app-store-card-free-game"),
    ).not.toBeInTheDocument();

    await user.click(
      within(screen.getByRole("group", { name: "Price" })).getByLabelText(
        /^Subscription/,
      ),
    );
    expect(screen.getByTestId("app-store-card-paid-docs")).toBeInTheDocument();
    expect(
      screen.queryByTestId("app-store-card-mystery"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByTestId("apps-clear-filters"));
    await user.click(
      within(screen.getByRole("group", { name: "License" })).getByLabelText(
        /^Free \/ open source/,
      ),
    );
    expect(screen.getByTestId("app-store-card-free-game")).toBeInTheDocument();
    expect(screen.getByTestId("app-store-card-once-chat")).toBeInTheDocument();
    expect(
      screen.queryByTestId("app-store-card-paid-docs"),
    ).not.toBeInTheDocument();
  });

  it("sorts by price with free first and unknown prices last in both directions", async () => {
    const user = userEvent.setup();
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([]);
    renderAppsScreen("/apps?view=store&sort=price-asc");
    await screen.findByTestId("app-store-card-paid-docs");
    const names = () =>
      cardOrder("").filter((n) =>
        ["Free Game", "Once Chat", "Paid Docs", "Mystery"].includes(n ?? ""),
      );
    expect(names()).toEqual(["Free Game", "Once Chat", "Paid Docs", "Mystery"]);
    await user.click(screen.getByLabelText("Price: high to low"));
    expect(names()).toEqual(["Paid Docs", "Once Chat", "Free Game", "Mystery"]);
  });

  it("installs free catalog apps but keeps paid apps disabled with an explanation and a sample label", async () => {
    const user = userEvent.setup();
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([]);
    const install = vi
      .spyOn(CanvasExtensionsService, "install")
      .mockResolvedValue(buildExtension({ name: "free-game" }));
    renderAppsScreen("/apps?view=store");
    await screen.findByTestId("app-store-card-paid-docs");

    const paid = screen.getByTestId("app-store-card-paid-docs-get");
    expect(paid).toBeDisabled();
    expect(paid).toHaveTextContent("Get for $10/month");
    expect(paid.parentElement).toHaveAttribute(
      "title",
      expect.stringContaining("payments are not set up"),
    );
    expect(
      screen.getByTestId("app-store-card-paid-docs-sample-pricing"),
    ).toBeVisible();
    expect(
      screen.queryByTestId("app-store-card-free-game-sample-pricing"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Contact the publisher")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("app-store-card-free-game-install"));
    expect(install).toHaveBeenCalledWith(
      expect.objectContaining({ source: "github:" }),
    );
    expect(install).toHaveBeenCalledTimes(1);
  });

  it("links the bottom Manage group to Skills, Plugins and MCP servers", async () => {
    const user = userEvent.setup();
    vi.spyOn(CanvasExtensionsService, "listInstalled").mockResolvedValue([]);
    renderAppsScreen();
    const nav = screen.getByRole("navigation", { name: "Manage" });
    expect(within(nav).getByRole("link", { name: "Skills" })).toHaveAttribute(
      "href",
      "/skills",
    );
    expect(within(nav).getByRole("link", { name: "Plugins" })).toHaveAttribute(
      "href",
      "/plugins",
    );
    expect(
      within(nav).getByRole("link", { name: "MCP servers" }),
    ).toHaveAttribute("href", "/mcp");
    await user.click(within(nav).getByRole("link", { name: "Skills" }));
    expect(navigateMock).toHaveBeenCalledWith("/skills");
  });
});
