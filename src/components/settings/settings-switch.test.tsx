// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsSwitch } from "@/src/components/settings/settings-switch";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

describe("SettingsSwitch", () => {
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
  });

  it("calls onToggle when the hidden checkbox changes", async () => {
    const onToggle = vi.fn();

    await act(async () => {
      root.render(
        <SettingsSwitch testId="test-switch" onToggle={onToggle}>
          Test Switch
        </SettingsSwitch>,
      );
    });

    const input = container.querySelector(
      '[data-testid="test-switch"]',
    ) as HTMLInputElement | null;

    await act(async () => {
      input?.click();
    });

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it("respects controlled isToggled without mutating internal state", async () => {
    const onToggle = vi.fn();

    await act(async () => {
      root.render(
        <SettingsSwitch
          testId="controlled-switch"
          isToggled={false}
          onToggle={onToggle}
        >
          Controlled
        </SettingsSwitch>,
      );
    });

    const input = container.querySelector(
      '[data-testid="controlled-switch"]',
    ) as HTMLInputElement | null;

    expect(input?.checked).toBe(false);

    await act(async () => {
      input?.click();
    });

    expect(onToggle).toHaveBeenCalledWith(true);
    expect(input?.checked).toBe(false);
  });
});
