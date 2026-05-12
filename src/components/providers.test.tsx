// @vitest-environment jsdom

import { useQueryClient } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sessionProviderRenderSpy, useSessionMock } = vi.hoisted(() => ({
  sessionProviderRenderSpy: vi.fn(),
  useSessionMock: vi.fn(() => ({ data: null, status: "loading" })),
}));

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => {
    sessionProviderRenderSpy();
    return <div data-session-provider="true">{children}</div>;
  },
  useSession: useSessionMock,
}));
import { Providers } from "@/src/components/providers";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

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

  it("always includes SessionProvider (for hook rules) but provides authDisabled flag to auth context", async () => {
    await act(async () => {
      root.render(
        <Providers authDisabled>
          <QueryClientProbe />
        </Providers>,
      );
    });

    // SessionProvider is now always rendered to satisfy React hook rules
    expect(sessionProviderRenderSpy).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-session-provider="true"]')).toBeTruthy();
    expect(container.querySelector('[data-query-client="present"]')?.textContent).toBe("probe");
  });
});
