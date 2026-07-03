// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PENDING_APPROVALS_QUERY_KEY,
  usePendingApprovalsCount,
} from "@/src/hooks/use-pending-approvals-count";
import type { AccessRequest } from "@/src/types/integrations-hub";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

const fetchJsonMock = vi.fn();

vi.mock("@/src/lib/fetch-json", () => ({
  fetchJson: (...args: unknown[]) => fetchJsonMock(...args),
}));

function renderHookValue<T>(render: () => T): {
  getValue: () => T;
  unmount: () => void;
} {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  const valueRef: { current: T | undefined } = { current: undefined };

  function Probe() {
    valueRef.current = render();
    return null;
  }

  act(() => {
    root.render(
      createElement(
        QueryClientProvider,
        { client: queryClient },
        createElement(Probe),
      ),
    );
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

describe("usePendingApprovalsCount", () => {
  beforeEach(() => {
    enableReactActEnvironment();
    fetchJsonMock.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns only pending access requests from the shared approvals query", async () => {
    const requests: AccessRequest[] = [
      {
        id: "req-1",
        status: "pending",
      } as AccessRequest,
      {
        id: "req-2",
        status: "approved",
      } as AccessRequest,
      {
        id: "req-3",
        status: "pending",
      } as AccessRequest,
    ];

    fetchJsonMock.mockResolvedValue(requests);

    const hook = renderHookValue(() => usePendingApprovalsCount());

    for (let attempt = 0; attempt < 5 && hook.getValue() !== 2; attempt += 1) {
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
    }

    expect(fetchJsonMock).toHaveBeenCalledWith("/api/case-by-case-approvals");
    expect(hook.getValue()).toBe(2);
    hook.unmount();
  });

  it("uses the access-requests query key shared with the approvals page", async () => {
    fetchJsonMock.mockResolvedValue([]);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        createElement(
          QueryClientProvider,
          { client: queryClient },
          createElement(() => {
            usePendingApprovalsCount();
            return null;
          }),
        ),
      );
    });

    await act(async () => {
      await queryClient.ensureQueryData({
        queryKey: PENDING_APPROVALS_QUERY_KEY,
        queryFn: () => fetchJsonMock(),
      });
    });

    expect(queryClient.getQueryData(PENDING_APPROVALS_QUERY_KEY)).toEqual([]);

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
