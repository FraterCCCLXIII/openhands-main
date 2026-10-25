import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "test-utils";
import { KamijiAvatar } from "#/components/features/kamiji/kamiji-avatar";
import { getKamijiColor } from "#/components/features/kamiji/kamiji-expressions";

describe("KamijiAvatar", () => {
  it("shows the flat hand in the requested colour when WebGL is unavailable", async () => {
    // Arrange / Act (jsdom has no canvas contexts, so the 3D scene cannot start)
    const { container } = renderWithProviders(
      <KamijiAvatar color="#4f8cff" expression="happy" size={40} />,
    );

    // Assert
    expect(screen.getByTestId("kamiji-avatar")).toHaveAttribute("role", "img");
    await waitFor(() => expect(container.querySelector("canvas")).toBeNull());
    expect(container.querySelector("svg g")).toHaveAttribute("fill", "#4f8cff");
    expect(container.querySelector("svg")).toHaveAttribute("width", "40");
  });
});

describe("getKamijiColor", () => {
  it("is stable per agent and varies between agents", () => {
    expect(getKamijiColor("agent-a")).toBe(getKamijiColor("agent-a"));
    expect(getKamijiColor("agent-a")).not.toBe(getKamijiColor("agent-b"));
  });
});
