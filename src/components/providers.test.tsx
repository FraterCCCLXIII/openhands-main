// @vitest-environment jsdom

import { useQueryClient } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

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
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("provides a React Query client", async () => {
    await act(async () => {
      root.render(
        <Providers>
          <QueryClientProbe />
        </Providers>,
      );
    });

    expect(container.querySelector('[data-query-client="present"]')?.textContent).toBe("probe");
  });

  it("supports auth-disabled deployments", async () => {
    await act(async () => {
      root.render(
        <Providers authDisabled>
          <QueryClientProbe />
        </Providers>,
      );
    });

    expect(container.querySelector('[data-query-client="present"]')?.textContent).toBe("probe");
  });
});
