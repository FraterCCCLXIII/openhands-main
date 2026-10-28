import { describe, expect, it } from "vitest";
import { scrollMinimapPanelItemIntoView } from "#/components/features/chat/conversation-minimap/scroll-minimap-panel-item-into-view";

function mockRect(top: number, height: number): DOMRect {
  return {
    top,
    bottom: top + height,
    height,
    left: 0,
    right: 100,
    width: 100,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}

describe("scrollMinimapPanelItemIntoView", () => {
  it("scrolls down when the active item is below the panel viewport", () => {
    const container = {
      scrollTop: 0,
      getBoundingClientRect: () => mockRect(100, 200),
    } as HTMLElement;
    const item = {
      getBoundingClientRect: () => mockRect(320, 40),
    } as HTMLElement;

    scrollMinimapPanelItemIntoView(container, item);

    expect(container.scrollTop).toBe(60);
  });

  it("scrolls up when the active item is above the panel viewport", () => {
    const container = {
      scrollTop: 120,
      getBoundingClientRect: () => mockRect(100, 200),
    } as HTMLElement;
    const item = {
      getBoundingClientRect: () => mockRect(60, 40),
    } as HTMLElement;

    scrollMinimapPanelItemIntoView(container, item);

    expect(container.scrollTop).toBe(80);
  });

  it("does not scroll when the active item is already fully visible", () => {
    const container = {
      scrollTop: 50,
      getBoundingClientRect: () => mockRect(100, 200),
    } as HTMLElement;
    const item = {
      getBoundingClientRect: () => mockRect(140, 40),
    } as HTMLElement;

    scrollMinimapPanelItemIntoView(container, item);

    expect(container.scrollTop).toBe(50);
  });
});
