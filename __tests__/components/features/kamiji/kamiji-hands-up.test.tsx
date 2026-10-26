import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "test-utils";
import { KamijiHandsUp } from "#/components/features/kamiji/kamiji-hands-up";

describe("KamijiHandsUp", () => {
  it("renders two hands in the requested colour with three black clap lines", () => {
    // Arrange / Act
    renderWithProviders(<KamijiHandsUp color="#4f8cff" size={120} />);

    // Assert
    const hands = screen.getAllByTestId("kamiji-avatar");
    expect(hands).toHaveLength(2);
    hands.forEach((hand) =>
      expect(hand.querySelector("svg g")).toHaveAttribute("fill", "#4f8cff"),
    );
    const blackStrokes = screen
      .getByTestId("kamiji-clap-lines")
      .querySelectorAll('g[stroke="black"] path');
    expect(blackStrokes).toHaveLength(3);
  });
});
