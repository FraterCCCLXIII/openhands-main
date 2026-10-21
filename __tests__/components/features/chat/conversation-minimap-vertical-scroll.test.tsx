import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConversationMinimapVerticalScroll } from "#/components/features/chat/conversation-minimap/conversation-minimap-vertical-scroll";

function mockVerticalScrollMetrics(
  element: HTMLElement,
  metrics: { scrollHeight: number; clientHeight: number; scrollTop: number },
) {
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    value: metrics.scrollHeight,
  });
  Object.defineProperty(element, "clientHeight", {
    configurable: true,
    value: metrics.clientHeight,
  });
  Object.defineProperty(element, "scrollTop", {
    configurable: true,
    writable: true,
    value: metrics.scrollTop,
  });
}

describe("ConversationMinimapVerticalScroll", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe = vi.fn();

        unobserve = vi.fn();

        disconnect = vi.fn();
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows an edge gradient only on the clipped side", () => {
    render(
      <ConversationMinimapVerticalScroll
        testId="conversation-minimap-track-scroll"
        fadeTestIdPrefix="conversation-minimap-track"
      >
        {Array.from({ length: 20 }, (_, index) => (
          <div key={index} data-testid={`item-${index}`}>
            Item {index}
          </div>
        ))}
      </ConversationMinimapVerticalScroll>,
    );

    const scroller = screen.getByTestId("conversation-minimap-track-scroll");
    const topFade = screen.getByTestId("conversation-minimap-track-fade-top");
    const bottomFade = screen.getByTestId(
      "conversation-minimap-track-fade-bottom",
    );

    mockVerticalScrollMetrics(scroller, {
      scrollHeight: 900,
      clientHeight: 320,
      scrollTop: 0,
    });
    fireEvent.scroll(scroller);

    expect(bottomFade).toHaveAttribute("data-visible", "true");
    expect(topFade).toHaveAttribute("data-visible", "false");

    mockVerticalScrollMetrics(scroller, {
      scrollHeight: 900,
      clientHeight: 320,
      scrollTop: 580,
    });
    fireEvent.scroll(scroller);

    expect(topFade).toHaveAttribute("data-visible", "true");
    expect(bottomFade).toHaveAttribute("data-visible", "false");
  });
});
