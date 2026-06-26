// @vitest-environment jsdom

import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ServiceUnavailableScreen } from "@/src/components/feedback/service-unavailable-screen";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

const render = (props: Parameters<typeof ServiceUnavailableScreen>[0]) => {
  const container = document.createElement("div");
  document.body.replaceChildren(container);
  let root: ReturnType<typeof createRoot> | null = null;
  act(() => {
    root = createRoot(container);
    root.render(<ServiceUnavailableScreen {...props} />);
  });
  return {
    container,
    unmount: () =>
      act(() => {
        root?.unmount();
      }),
  };
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("ServiceUnavailableScreen", () => {
  it("renders a Try again button that triggers onRetry when provided", () => {
    const onRetry = vi.fn();
    const { container, unmount } = render({ isAdmin: false, onRetry });

    const button = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Try again"),
    );
    expect(button).toBeDefined();
    act(() => button!.click());
    expect(onRetry).toHaveBeenCalledTimes(1);
    unmount();
  });

  it("does not render a retry button when onRetry is omitted", () => {
    const { container } = render({ isAdmin: true });
    const button = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Try again"),
    );
    expect(button).toBeUndefined();
  });

  it("disables the retry button and shows Retrying while isRetrying is true", () => {
    const onRetry = vi.fn();
    const { container } = render({
      isAdmin: false,
      onRetry,
      isRetrying: true,
    });
    const button = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Retrying"),
    ) as HTMLButtonElement | undefined;
    expect(button).toBeDefined();
    expect(button!.disabled).toBe(true);
    act(() => button!.click());
    expect(onRetry).not.toHaveBeenCalled();
  });
});