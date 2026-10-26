import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "test-utils";
import { KamijiLookAvatar } from "#/components/features/kamiji/kamiji-look-avatar";

describe("KamijiLookAvatar", () => {
  it("falls back to the flat hand and the prop's emoji when WebGL is unavailable", async () => {
    // Arrange / Act (jsdom has no canvas contexts, so no 3D scene can start)
    const { container } = renderWithProviders(
      <KamijiLookAvatar look="status:finished" size={40} color="#4f8cff" />,
    );

    // Assert
    await waitFor(() => expect(container.querySelector("canvas")).toBeNull());
    expect(container.querySelector("svg g")).toHaveAttribute("fill", "#4f8cff");
    expect(screen.getByTestId("kamiji-look-prop")).toHaveTextContent("✅");
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });

  it("leaves the prop badge off avatars too small to carry it", () => {
    renderWithProviders(<KamijiLookAvatar look="status:finished" size={20} />);

    expect(screen.queryByTestId("kamiji-look-prop")).not.toBeInTheDocument();
  });
});
