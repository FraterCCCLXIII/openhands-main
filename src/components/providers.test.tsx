// @vitest-environment jsdom

import { useQueryClient } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sessionProviderRenderSpy } = vi.hoisted(() => ({
  sessionProviderRenderSpy: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => {
    sessionProviderRenderSpy();
    return <div data-session-provider="true">{children}</div>;
  },
}));
import { Providers } from "@/src/components/providers";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const QueryClientProbe = () => {
  const queryClient = useQueryClient();
  return <div data-query-client={queryClient ? "present" : "missing"}>probe</div>;
};

describe("Providers", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    sessionProviderRenderSpy.mockReset();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("wraps the app in SessionProvider when auth is enabled", async () => {
    await act(async () => {
      root.render(
        <Providers>
          <QueryClientProbe />
        </Providers>,
      );
    });

    expect(sessionProviderRenderSpy).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-session-provider="true"]')).toBeTruthy();
    expect(container.querySelector('[data-query-client="present"]')?.textContent).toBe("probe");
  });

  it("skips SessionProvider while still providing React Query when auth is disabled", async () => {
    await act(async () => {
      root.render(
        <Providers authDisabled>
          <QueryClientProbe />
        </Providers>,
      );
    });

    expect(sessionProviderRenderSpy).not.toHaveBeenCalled();
    expect(container.querySelector('[data-session-provider="true"]')).toBeNull();
    expect(container.querySelector('[data-query-client="present"]')?.textContent).toBe("probe");
  });
});
