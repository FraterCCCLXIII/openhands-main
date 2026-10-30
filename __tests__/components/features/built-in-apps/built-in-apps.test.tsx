import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  setActiveSelection,
  setRegisteredBackends,
} from "#/api/backend-registry/active-store";
import type { Backend } from "#/api/backend-registry/types";
import { BuiltInAppRouteGuard } from "#/components/features/built-in-apps/built-in-app-route-guard";
import { BuiltInAppsSection } from "#/components/features/built-in-apps/built-in-apps-section";
import { SidebarAppsList } from "#/components/features/sidebar/sidebar-apps-list";
import { SidebarCreateMenu } from "#/components/features/sidebar/sidebar-create-menu";
import { NavigationProvider } from "#/context/navigation-context";
import { ActiveBackendProvider } from "#/contexts/active-backend-context";
import translations from "#/i18n/translation.json";
import { useBuiltInAppsStore } from "#/stores/built-in-apps-store";

// Resolve keys to their English text, with {{placeholders}} filled in.
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
  id: "apps-backend",
  name: "Apps backend",
  host: "http://127.0.0.1:8000",
  apiKey: "test-key",
  kind: "local",
};

function renderAt(path: string, ui: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
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
            {ui}
          </NavigationProvider>
        </MemoryRouter>
      </ActiveBackendProvider>
    </QueryClientProvider>,
  );
}

const turnOff = (
  ...ids: Parameters<
    ReturnType<typeof useBuiltInAppsStore.getState>["setEnabled"]
  >[1][]
) =>
  ids.forEach((id) =>
    useBuiltInAppsStore.getState().setEnabled(backend.id, id, false),
  );

describe("built-in app switches", () => {
  beforeEach(() => {
    localStorage.clear();
    useBuiltInAppsStore.setState({ byBackend: {} });
    setRegisteredBackends([backend]);
    setActiveSelection({ backendId: backend.id });
  });

  afterEach(() => {
    setActiveSelection(null);
    setRegisteredBackends([]);
  });

  describe("navigation", () => {
    it("shows Tower and Commons tiles by default", () => {
      renderAt("/", <SidebarAppsList collapsed={false} />);

      expect(screen.getByTestId("sidebar-feed-link")).toHaveTextContent(
        "Tower",
      );
      expect(screen.getByTestId("sidebar-team-chat-link")).toBeInTheDocument();
    });

    it("hides a tile when its app is off and leaves the others", () => {
      turnOff("tower");
      renderAt("/", <SidebarAppsList collapsed={false} />);

      expect(screen.queryByTestId("sidebar-feed-link")).not.toBeInTheDocument();
      expect(screen.getByTestId("sidebar-team-chat-link")).toBeInTheDocument();
    });

    it("hides the New Chat menu entries of an app that is off", async () => {
      turnOff("factory", "automations");
      renderAt("/", <SidebarCreateMenu />);

      await userEvent.click(screen.getByTestId("sidebar-create-menu-trigger"));

      expect(
        screen.queryByTestId("sidebar-create-factory"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("sidebar-create-automation"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("sidebar-create-conversation"),
      ).toBeInTheDocument();
    });
  });

  describe("route guard", () => {
    const page = <div data-testid="real-page" />;

    it("renders the route when its app is on", () => {
      renderAt(
        "/feed/people/ada",
        <BuiltInAppRouteGuard>{page}</BuiltInAppRouteGuard>,
      );

      expect(screen.getByTestId("real-page")).toBeInTheDocument();
    });

    it("explains a turned-off app instead of a 404, with a link to Apps", () => {
      turnOff("tower");
      renderAt(
        "/feed/people/ada",
        <BuiltInAppRouteGuard>{page}</BuiltInAppRouteGuard>,
      );

      expect(screen.queryByTestId("real-page")).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /^Tower\S* is turned off$/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Turn it on in Customize > Apps."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Open Customize > Apps" }),
      ).toHaveAttribute("href", "/apps");
    });

    it("guards factory pages by the Factory switch, not the Automations one", () => {
      turnOff("factory");
      renderAt(
        "/automations/factories/f1",
        <BuiltInAppRouteGuard>{page}</BuiltInAppRouteGuard>,
      );

      expect(
        screen.getByRole("heading", { name: "Factory is turned off" }),
      ).toBeInTheDocument();
    });

    it("never guards core routes", () => {
      turnOff("tower", "factory", "commons");
      renderAt(
        "/settings/app",
        <BuiltInAppRouteGuard>{page}</BuiltInAppRouteGuard>,
      );

      expect(screen.getByTestId("real-page")).toBeInTheDocument();
    });

    it("keeps the app's data when it is turned off", () => {
      localStorage.setItem("team-chat", '{"state":{}}');
      turnOff("commons");
      renderAt(
        "/team-chat",
        <BuiltInAppRouteGuard>{page}</BuiltInAppRouteGuard>,
      );

      expect(localStorage.getItem("team-chat")).toBe('{"state":{}}');
    });
  });

  describe("Customize > Apps switches", () => {
    it("renders an accessible switch per app and turns one off and on", async () => {
      renderAt("/apps", <BuiltInAppsSection />);

      const tower = screen.getByRole("checkbox", { name: /Tower/ });
      expect(tower).toBeChecked();

      await userEvent.click(tower);
      expect(tower).not.toBeChecked();
      expect(useBuiltInAppsStore.getState().byBackend[backend.id]).toEqual({
        tower: false,
      });

      await userEvent.click(tower);
      expect(tower).toBeChecked();
    });

    it("locks Automations, with a reason, while Factory needs it", async () => {
      renderAt("/apps", <BuiltInAppsSection />);

      const automations = screen.getByTestId("built-in-app-switch-automations");
      expect(automations).toBeDisabled();
      expect(
        screen.getByTestId("built-in-app-lock-automations"),
      ).toHaveTextContent("Needed by Factory");

      await userEvent.click(screen.getByTestId("built-in-app-switch-factory"));
      expect(automations).toBeEnabled();
    });

    it.each(["tower", "factory", "automations", "commons"] as const)(
      "shows a decorative icon before the name on the %s row",
      (id) => {
        renderAt("/apps", <BuiltInAppsSection />);

        const row = screen.getByTestId(`built-in-app-row-${id}`);
        const icon = within(row).getByTestId(`built-in-app-icon-${id}`);
        const switchInput = within(row).getByTestId(
          `built-in-app-switch-${id}`,
        );

        expect(icon).toHaveAttribute("aria-hidden", "true");
        expect(
          icon.compareDocumentPosition(switchInput) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        ).toBeTruthy();
      },
    );

    it("locks Factory while Automations is off", async () => {
      turnOff("factory", "automations");
      renderAt("/apps", <BuiltInAppsSection />);

      expect(screen.getByTestId("built-in-app-switch-factory")).toBeDisabled();
      expect(screen.getByTestId("built-in-app-lock-factory")).toHaveTextContent(
        "Needs Automations",
      );
    });
  });
});
