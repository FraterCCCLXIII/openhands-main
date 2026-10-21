import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isConversationTurnInDom,
  navigateToConversationTurn,
  scrollToConversationTurn,
} from "#/components/features/chat/conversation-minimap/conversation-minimap-turn";

describe("isConversationTurnInDom", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("returns true when the turn anchor exists", () => {
    document.body.innerHTML =
      '<div data-conversation-turn-id="turn-1">Hello</div>';

    expect(isConversationTurnInDom("turn-1")).toBe(true);
  });

  it("returns false when the turn anchor is missing", () => {
    expect(isConversationTurnInDom("turn-1")).toBe(false);
  });
});

describe("scrollToConversationTurn", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("scrolls the container to the matching turn", () => {
    const scrollContainer = document.createElement("div");
    scrollContainer.scrollTo = vi.fn();
    Object.defineProperty(scrollContainer, "scrollTop", {
      value: 100,
      writable: true,
    });
    scrollContainer.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: 400,
        height: 400,
        left: 0,
        right: 300,
        width: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;

    const turn = document.createElement("div");
    turn.setAttribute("data-conversation-turn-id", "turn-1");
    turn.getBoundingClientRect = () =>
      ({
        top: 180,
        bottom: 220,
        height: 40,
        left: 0,
        right: 300,
        width: 300,
        x: 0,
        y: 180,
        toJSON: () => ({}),
      }) as DOMRect;
    scrollContainer.appendChild(turn);
    document.body.appendChild(scrollContainer);

    scrollToConversationTurn(scrollContainer, "turn-1");

    expect(scrollContainer.scrollTo).toHaveBeenCalledWith({
      top: 256,
      behavior: "smooth",
    });
  });
});

describe("navigateToConversationTurn", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("loads older pages until the turn appears, then scrolls", async () => {
    const scrollContainer = document.createElement("div");
    scrollContainer.scrollTo = vi.fn();
    Object.defineProperty(scrollContainer, "scrollTop", {
      value: 0,
      writable: true,
    });
    scrollContainer.getBoundingClientRect = () =>
      ({
        top: 0,
        bottom: 400,
        height: 400,
        left: 0,
        right: 300,
        width: 300,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
    document.body.appendChild(scrollContainer);

    const loadedEventIds = new Set<string>();
    const loadOlder = vi.fn(async () => {
      loadedEventIds.add("turn-old");
      const turn = document.createElement("div");
      turn.setAttribute("data-conversation-turn-id", "turn-old");
      turn.getBoundingClientRect = () =>
        ({
          top: 40,
          bottom: 80,
          height: 40,
          left: 0,
          right: 300,
          width: 300,
          x: 0,
          y: 40,
          toJSON: () => ({}),
        }) as DOMRect;
      scrollContainer.appendChild(turn);
    });

    const result = await navigateToConversationTurn(
      scrollContainer,
      "turn-old",
      {
        loadOlder,
        isEventInStore: (eventId) => loadedEventIds.has(eventId),
        getEventCount: () => loadedEventIds.size,
      },
    );

    expect(result).toBe(true);
    expect(loadOlder).toHaveBeenCalledTimes(1);
    expect(scrollContainer.scrollTo).toHaveBeenCalledWith({
      top: 16,
      behavior: "smooth",
    });
  });

  it("stops requesting older pages when history is exhausted", async () => {
    const scrollContainer = document.createElement("div");
    document.body.appendChild(scrollContainer);

    const loadOlder = vi.fn(async () => {});

    const result = await navigateToConversationTurn(
      scrollContainer,
      "missing-turn",
      {
        loadOlder,
        isEventInStore: () => false,
        getEventCount: () => 0,
      },
    );

    expect(result).toBe(false);
    expect(loadOlder).toHaveBeenCalledTimes(1);
  });
});
