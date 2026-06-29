// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardSidebar } from "@/src/components/layout/dashboard-sidebar";
import { DashboardMobileMenuBar } from "@/src/components/layout/dashboard-mobile-menu-bar";
import { DashboardMobileNavProvider } from "@/src/components/layout/dashboard-mobile-nav-context";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

const { usePathnameMock, usePendingApprovalsCountMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(() => "/integrations"),
  usePendingApprovalsCountMock: vi.fn(() => 4),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("@/src/hooks/use-pending-approvals-count", () => ({
  usePendingApprovalsCount: usePendingApprovalsCountMock,
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

describe("DashboardSidebar", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    enableReactActEnvironment();
    useSidebarStore.setState({ collapsed: false });
    usePathnameMock.mockReturnValue("/integrations");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  const renderSidebar = () => {
    act(() => {
      root.render(
        <DashboardMobileNavProvider>
          <DashboardSidebar
            activeItem="integrations"
            stats={{
              liveIntegrations: 4,
              toolCount: 9,
            }}
            userDisplayName="Local Dev User"
            userEmail="dev@localhost"
          />
          <DashboardMobileMenuBar />
        </DashboardMobileNavProvider>,
      );
    });
  };

  it("collapses and expands from the desktop toggle", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });

    renderSidebar();

    const sidebar = container.querySelector('[data-testid="dashboard-sidebar"]');
    expect(sidebar?.getAttribute("data-collapsed")).toBe("false");
    expect(container.textContent).toContain("Integrations Hub");

    const collapseToggle = container.querySelector(
      '[data-testid="dashboard-sidebar-collapse-toggle"]',
    );
    act(() => {
      collapseToggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(sidebar?.getAttribute("data-collapsed")).toBe("true");
    expect(container.textContent).not.toContain("Integrations Hub");
    expect(
      container.querySelector('[data-testid="dashboard-sidebar-stats"]')?.getAttribute("aria-hidden"),
    ).toBe("true");

    const railBody = sidebar?.querySelector(".flex.min-h-0.flex-1.flex-col");
    act(() => {
      railBody?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(sidebar?.getAttribute("data-collapsed")).toBe("false");
  });

  it("shows pending approvals on the nav item instead of the stats row", () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1280,
    });

    renderSidebar();

    expect(container.textContent).not.toContain("4 Pending");
    expect(
      container.querySelector(
        'a[href="/case-by-case-approvals"] [data-testid="dashboard-nav-trailing-count"]',
      )?.textContent,
    ).toBe("4");
  });

  it("uses the compact rail width on tablet-sized viewports", async () => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 820,
    });

    renderSidebar();

    await act(async () => {
      await Promise.resolve();
    });

    const sidebar = container.querySelector('[data-testid="dashboard-sidebar"]');
    expect(sidebar?.getAttribute("data-collapsed")).toBe("true");
    expect(sidebar?.className).toContain("md:w-[60px]");
    expect(container.textContent).not.toContain("Integrations Hub");
  });

  it("opens and closes the mobile drawer", async () => {
    renderSidebar();

    expect(
      container.querySelector('[data-testid="dashboard-sidebar-mobile-drawer"]'),
    ).toBeNull();

    const menuToggle = container.querySelector(
      '[data-testid="dashboard-mobile-menu-toggle"]',
    );
    await act(async () => {
      menuToggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
    });

    const drawer = container.querySelector(
      '[data-testid="dashboard-sidebar-mobile-drawer"]',
    );
    expect(drawer?.getAttribute("aria-hidden")).toBe("false");
    expect(drawer?.className).toContain("translate-x-0");
    expect(
      container.querySelector('[data-testid="dashboard-mobile-drawer-close"]'),
    ).toBeTruthy();

    const closeButton = container.querySelector(
      '[data-testid="dashboard-mobile-drawer-close"]',
    );
    act(() => {
      closeButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(drawer?.getAttribute("aria-hidden")).toBe("true");
  });
});
