// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AccessModeSlider,
  accessModeLabel,
  getAccessModeDropdownTestId,
} from "@/src/components/integrations/tool-access-controls";

import {
  enableReactActEnvironment,
  selectDropdownOption,
} from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

describe("AccessModeSlider", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    document.body.replaceChildren();
  });

  it("renders the current access mode in a dropdown trigger", async () => {
    await act(async () => {
      root.render(
        <AccessModeSlider
          toolName="create_pull_request"
          mode="enabled"
          onChange={vi.fn()}
        />,
      );
    });

    const trigger = container.querySelector(
      `[data-testid="${getAccessModeDropdownTestId("create_pull_request")}-trigger"]`,
    ) as HTMLButtonElement | null;

    expect(trigger).toBeTruthy();
    expect(trigger?.textContent).toContain(accessModeLabel("enabled"));
    expect(trigger?.className).toContain("text-[var(--oh-color-success)]");
    expect(trigger?.querySelector("svg")?.getAttribute("class")).toContain("text-current");
    expect(trigger?.className).toContain("hover:bg-[color:rgba(165,231,94,0.18)]");
    expect(trigger?.className).not.toContain("rounded-full");
    expect(
      container.querySelector('[data-access-mode="enabled"]'),
    ).toBeTruthy();
  });

  it("uses mode-specific trigger styling for non-default access modes", async () => {
    await act(async () => {
      root.render(
        <AccessModeSlider
          toolName="compose_plan"
          mode="approval_required"
          onChange={vi.fn()}
        />,
      );
    });

    const trigger = container.querySelector(
      `[data-testid="${getAccessModeDropdownTestId("compose_plan")}-trigger"]`,
    ) as HTMLButtonElement | null;

    expect(trigger?.className).toContain("text-[var(--oh-warning)]");
    expect(trigger?.className).toContain("hover:bg-[color:rgba(217,181,90,0.18)]");
    expect(trigger?.className).not.toContain("bg-white/10");
    expect(trigger?.className).not.toContain("border-white/60");
  });

  it("calls onChange when a different access mode is selected", async () => {
    const onChange = vi.fn();

    await act(async () => {
      root.render(
        <AccessModeSlider
          toolName="create_pull_request"
          mode="enabled"
          onChange={onChange}
        />,
      );
    });

    await act(async () => {
      await selectDropdownOption(
        container,
        getAccessModeDropdownTestId("create_pull_request"),
        "approval_required",
      );
    });

    expect(onChange).toHaveBeenCalledWith("approval_required");
  });

  it("omits access modes above the configured maximum", async () => {
    await act(async () => {
      root.render(
        <AccessModeSlider
          toolName="searchPages"
          mode="approval_required"
          maxMode="approval_required"
          onChange={vi.fn()}
        />,
      );
    });

    const trigger = container.querySelector(
      `[data-testid="${getAccessModeDropdownTestId("searchPages")}-trigger"]`,
    ) as HTMLButtonElement | null;

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
    });

    expect(
      document.querySelector(
        `[data-testid="${getAccessModeDropdownTestId("searchPages")}-enabled"]`,
      ),
    ).toBeNull();
    expect(
      document.querySelector(
        `[data-testid="${getAccessModeDropdownTestId("searchPages")}-approval_required"]`,
      ),
    ).toBeTruthy();
    expect(
      document.querySelector(
        `[data-testid="${getAccessModeDropdownTestId("searchPages")}-disabled"]`,
      ),
    ).toBeTruthy();
  });
});
