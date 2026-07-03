// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminCatalogFilterSelect } from "@/src/components/admin/integrations/admin-catalog-filter-select";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

describe("AdminCatalogFilterSelect", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
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

  it("opens the menu and selects a filter option", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.render(
        <AdminCatalogFilterSelect value="all" onChange={onChange} />,
      );
    });

    const trigger = container.querySelector(
      '[data-testid="admin-catalog-filter-select"]',
    ) as HTMLButtonElement;
    expect(trigger?.textContent).toContain("All");
    expect(trigger?.className).toContain("bg-base-secondary");
    expect(trigger?.className).toContain("text-[var(--oh-muted)]");
    expect(trigger?.className).toContain("hover:bg-[var(--oh-interactive-hover)]");

    await act(async () => {
      trigger.click();
    });

    const readyNowOption = document.body.querySelector(
      '[data-testid="admin-catalog-filter-ready_now"]',
    ) as HTMLButtonElement;
    expect(readyNowOption).toBeTruthy();

    await act(async () => {
      readyNowOption.click();
    });

    expect(onChange).toHaveBeenCalledWith("ready_now");
  });
});
