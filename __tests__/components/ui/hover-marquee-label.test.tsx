import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HoverMarqueeLabel } from "#/ui/dropdown/hover-marquee-label";

const LONG_LABEL = "A very long backend name that does not fit";

function mockLayout(clientWidth: number, scrollWidth: number) {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(
    clientWidth,
  );
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(
    scrollWidth,
  );
}

function renderLabel(text: string) {
  render(
    <div className="group" data-testid="row">
      <HoverMarqueeLabel>{text}</HoverMarqueeLabel>
    </div>,
  );
}

describe("HoverMarqueeLabel", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("adds a scrolling copy and a full-text tooltip when the label overflows", () => {
    mockLayout(80, 200);
    renderLabel(LONG_LABEL);

    expect(screen.getByTestId("hover-marquee-label-scroll")).toHaveTextContent(
      LONG_LABEL,
    );
    expect(screen.getByTestId("hover-marquee-label")).toHaveAttribute(
      "title",
      LONG_LABEL,
    );
  });

  it("does not add edge fades or a scrolling copy when the label fits", () => {
    mockLayout(200, 120);
    renderLabel("Short");

    expect(
      screen.queryByTestId("hover-marquee-label-scroll"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("hover-marquee-label")).not.toHaveAttribute(
      "title",
    );
    expect(screen.getByTestId("hover-marquee-label-clip")).not.toHaveClass(
      "hover-marquee-clip",
    );
  });

  it("returns to the truncated start after the pointer leaves the row", () => {
    mockLayout(80, 200);
    renderLabel(LONG_LABEL);
    const scroll = screen.getByTestId("hover-marquee-label-scroll");

    fireEvent.mouseLeave(screen.getByTestId("row"));
    expect(scroll).toHaveAttribute("data-phase", "exiting");

    act(() => {
      const event = new Event("transitionend", { bubbles: true });
      Object.assign(event, { propertyName: "opacity" });
      screen.getByTestId("hover-marquee-label-rest").dispatchEvent(event);
    });
    expect(scroll).toHaveAttribute("data-phase", "idle");
  });
});
