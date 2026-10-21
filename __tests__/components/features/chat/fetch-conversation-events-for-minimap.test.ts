import { describe, expect, it } from "vitest";
import { hasMoreEventSearchPages, isEventSearchExhausted } from "#/components/features/chat/conversation-minimap/fetch-conversation-events-for-minimap";

describe("hasMoreEventSearchPages", () => {
  it("returns true when the server provides next_page_id", () => {
    expect(
      hasMoreEventSearchPages({ next_page_id: "page-2", items: [1, 2] }, 50),
    ).toBe(true);
  });

  it("returns true when the page is full even without next_page_id", () => {
    expect(
      hasMoreEventSearchPages(
        { next_page_id: null, items: Array.from({ length: 50 }) },
        50,
      ),
    ).toBe(true);
  });

  it("returns false when the page is short and has no next_page_id", () => {
    expect(
      hasMoreEventSearchPages({ next_page_id: null, items: [1, 2, 3] }, 50),
    ).toBe(false);
  });
});

describe("isEventSearchExhausted", () => {
  it("returns true for an empty page", () => {
    expect(isEventSearchExhausted({ next_page_id: null, items: [] }, 50)).toBe(
      true,
    );
  });

  it("returns false while next_page_id is present", () => {
    expect(
      isEventSearchExhausted(
        { next_page_id: "page-2", items: Array.from({ length: 50 }) },
        50,
      ),
    ).toBe(false);
  });
});
