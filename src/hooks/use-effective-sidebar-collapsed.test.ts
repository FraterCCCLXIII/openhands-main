// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { useEffectiveSidebarCollapsed } from "@/src/hooks/use-effective-sidebar-collapsed";
import { useSidebarStore } from "@/src/stores/sidebar-store";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

function setWindowWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

function renderHookValue<T>(render: () => T): {
  getValue: () => T;
  unmount: () => void;
} {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const valueRef: { current: T | undefined } = { current: undefined };

  function Probe() {
    valueRef.current = render();
    return null;
  }

  act(() => {
    root.render(createElement(Probe));
  });

  return {
    getValue: () => {
      if (valueRef.current === undefined) {
        throw new Error("Hook value was not captured");
      }
      return valueRef.current;
    },
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("useEffectiveSidebarCollapsed", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    enableReactActEnvironment();
    useSidebarStore.setState({ collapsed: false });
    setWindowWidth(1200);
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("uses the stored collapse preference on wide viewports", async () => {
    useSidebarStore.setState({ collapsed: true });
    const hook = renderHookValue(() => useEffectiveSidebarCollapsed());

    await act(async () => {
      await Promise.resolve();
    });

    expect(hook.getValue()).toBe(true);
    hook.unmount();
  });

  it("auto-collapses on compact desktop widths", async () => {
    setWindowWidth(820);
    const hook = renderHookValue(() => useEffectiveSidebarCollapsed());

    await act(async () => {
      await Promise.resolve();
    });

    expect(hook.getValue()).toBe(true);
    hook.unmount();
  });

  it("does not auto-collapse when the rail is hidden for mobile drawer mode", async () => {
    setWindowWidth(375);
    const hook = renderHookValue(() => useEffectiveSidebarCollapsed());

    await act(async () => {
      await Promise.resolve();
    });

    expect(hook.getValue()).toBe(false);
    hook.unmount();
  });
});
