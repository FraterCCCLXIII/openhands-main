import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RollingNumber } from "#/components/shared/rolling-number";

describe("RollingNumber", () => {
  it("exposes the formatted value with its prefix as plain text", () => {
    render(<RollingNumber value={1234} prefix="+" />);

    expect(screen.getByText("+1,234", { selector: ".sr-only" })).toBeVisible();
  });

  it("updates the plain-text value when the number changes", () => {
    const { rerender } = render(<RollingNumber value={58} prefix="−" />);

    rerender(<RollingNumber value={412} prefix="−" />);

    expect(
      screen.getByText("−412", { selector: ".sr-only" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("−58", { selector: ".sr-only" })).toBeNull();
  });
});
