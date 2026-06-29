// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ToolDescriptionPreview } from "@/src/components/integrations/tool-description-preview";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

describe("ToolDescriptionPreview", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    class ResizeObserverMock {
      private readonly callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }

      observe(element: Element) {
        if (
          element instanceof HTMLElement &&
          element.textContent &&
          element.textContent.length > 20
        ) {
          Object.defineProperty(element, "scrollWidth", {
            configurable: true,
            value: 300,
          });
          Object.defineProperty(element, "clientWidth", {
            configurable: true,
            value: 100,
          });
        }

        this.callback([], this as ResizeObserver);
      }

      disconnect() {}
    }

    vi.stubGlobal("ResizeObserver", ResizeObserverMock);

    container = document.createElement("div");
    container.style.width = "120px";
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

  it("shows View More for truncated descriptions and reveals the full text", async () => {
    const description =
      "Create Chapter Path params: project_id. Provide the request payload under `body`.";

    await act(async () => {
      root.render(
        <ToolDescriptionPreview
          testId="tool-description-add_chapter"
          description={description}
          defaultScopes={["projects:write"]}
        />,
      );
    });

    const viewMore = container.querySelector(
      '[data-testid="tool-description-add_chapter-view-more"]',
    ) as HTMLButtonElement | null;

    expect(viewMore).toBeTruthy();

    await act(async () => {
      viewMore?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain(description);
    expect(container.textContent).toContain(
      INTEGRATIONS_PAGE_COPY.installedDefaultScopesLabel,
    );
    expect(container.textContent).toContain("projects:write");
    expect(
      container.querySelector(
        '[data-testid="tool-description-add_chapter-view-less"]',
      ),
    ).toBeTruthy();
  });

  it("does not show View More for short descriptions", async () => {
    await act(async () => {
      root.render(
        <ToolDescriptionPreview
          testId="tool-description-short"
          description="Search pages"
        />,
      );
    });

    expect(
      container.querySelector('[data-testid="tool-description-short-view-more"]'),
    ).toBeNull();
  });
});
