// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBreakpoint } from "@/src/hooks/use-breakpoint";
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

describe("useBreakpoint", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    enableReactActEnvironment();
    setWindowWidth(1200);
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("returns false when window width is above the breakpoint", async () => {
    setWindowWidth(1200);
    const hook = renderHookValue(() => useBreakpoint());

    await act(async () => {
      await Promise.resolve();
    });

    expect(hook.getValue()).toBe(false);
    hook.unmount();
  });

  it("returns true when window width is at or below the breakpoint", async () => {
    setWindowWidth(800);
    const hook = renderHookValue(() => useBreakpoint());

    await act(async () => {
      await Promise.resolve();
    });

    expect(hook.getValue()).toBe(true);
    hook.unmount();
  });

  it("updates when the window crosses the breakpoint", async () => {
    setWindowWidth(1200);
    const hook = renderHookValue(() => useBreakpoint());

    await act(async () => {
      await Promise.resolve();
    });
    expect(hook.getValue()).toBe(false);

    act(() => {
      setWindowWidth(800);
    });
    expect(hook.getValue()).toBe(true);
    hook.unmount();
  });

  it("accepts a custom breakpoint value", async () => {
    setWindowWidth(768);
    const hook = renderHookValue(() => useBreakpoint(768));

    await act(async () => {
      await Promise.resolve();
    });
    expect(hook.getValue()).toBe(true);

    act(() => {
      setWindowWidth(769);
    });
    expect(hook.getValue()).toBe(false);
    hook.unmount();
  });

  it("cleans up the resize listener on unmount", async () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const hook = renderHookValue(() => useBreakpoint());

    await act(async () => {
      await Promise.resolve();
    });

    hook.unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });
});
