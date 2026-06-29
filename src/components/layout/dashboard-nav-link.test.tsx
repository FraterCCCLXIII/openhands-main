// @vitest-environment jsdom

import { PlugZap } from "lucide-react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardNavLink } from "@/src/components/layout/dashboard-nav-link";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("DashboardNavLink collapsed tooltips", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    enableReactActEnvironment();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    document.body.querySelectorAll('[role="tooltip"]').forEach((node) => node.remove());
  });

  it("shows a right-side tooltip label when collapsed nav links are hovered", () => {
    act(() => {
      root.render(
        <DashboardNavLink
          href="/integrations"
          icon={PlugZap}
          label="Integrations"
          collapsed
        />,
      );
    });

    const link = container.querySelector("a");
    const trigger = container.querySelector('[data-testid="sidebar-tooltip-trigger"]');
    expect(link?.getAttribute("title")).toBeNull();
    expect(trigger).toBeTruthy();

    act(() => {
      trigger?.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    const tooltip = document.body.querySelector('[role="tooltip"]');
    expect(tooltip?.textContent).toBe("Integrations");
    expect(tooltip?.className).toContain("bg-white");
  });
});
