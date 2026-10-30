import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RegisteredCanvasExtensionPage } from "#/components/features/canvas-extensions/canvas-extensions-runtime";
import { useBackendTileViewStore } from "#/stores/backend-tile-view-store";
import { BackendLeftRail } from "./backend-left-rail";

const runtime = vi.hoisted(() => ({
  pages: [] as RegisteredCanvasExtensionPage[],
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { app?: string }) =>
      opts?.app ? `${key}:${opts.app}` : key,
  }),
}));
vi.mock(
  "#/components/features/canvas-extensions/canvas-extensions-runtime",
  () => ({ useCanvasExtensionsRuntime: () => runtime }),
);
vi.mock(
  "#/components/features/canvas-extensions/canvas-extension-icon",
  () => ({ CanvasExtensionIcon: () => <span data-testid="app-icon" /> }),
);
vi.mock("#/contexts/active-backend-context", () => ({
  useActiveBackendContext: () => ({ active: { backend: { id: "none" } } }),
}));
vi.mock("#/api/backend-registry/active-store", () => ({
  isNoBackend: () => true,
}));
vi.mock("./backend-selector", () => ({
  useBackendOptions: () => ({
    backends: [],
    options: [],
    healthByBackendId: {},
  }),
  useSelectBackendOption: () => vi.fn(),
  makeOptionValue: vi.fn(),
  parseOptionValue: vi.fn(),
  accountFallbackIcon: vi.fn(),
}));
vi.mock("#/hooks/use-desktop-full-screen", () => ({
  useDesktopFullScreen: () => false,
}));

function page(name: string, label: string): RegisteredCanvasExtensionPage {
  return {
    extension: { name } as RegisteredCanvasExtensionPage["extension"],
    contribution: {
      id: "main",
      title: label,
      path: "main",
    } as RegisteredCanvasExtensionPage["contribution"],
    mount: vi.fn() as unknown as RegisteredCanvasExtensionPage["mount"],
    href: `/extensions/${name}/main`,
  };
}

function Path() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderRail(initial = "/") {
  render(
    <MemoryRouter initialEntries={[initial]}>
      <BackendLeftRail />
      <Path />
    </MemoryRouter>,
  );
}

describe("BackendLeftRail apps", () => {
  beforeEach(() => {
    useBackendTileViewStore.setState({ enabled: true });
    runtime.pages = [page("projects-hub", "Projector")];
  });

  it("opens an installed app's page and marks it current", async () => {
    renderRail();
    const button = screen.getByRole("button", { name: "Projector" });
    expect(button).not.toHaveAttribute("aria-current");

    await userEvent.click(button);

    expect(screen.getByTestId("path")).toHaveTextContent(
      "/extensions/projects-hub/main",
    );
    expect(button).toHaveAttribute("aria-current", "page");
  });

  it("disables an app that is not installed and explains how to install it", async () => {
    renderRail();
    const missing = screen.getByTestId("backend-rail-app-work-inventory");

    expect(missing).toHaveAttribute("aria-disabled", "true");
    expect(missing).toHaveAttribute(
      "title",
      "BACKEND$RAIL_APP_NOT_INSTALLED:Work inventory",
    );
    await userEvent.click(missing);
    expect(screen.getByTestId("path")).toHaveTextContent("/");
  });
});
