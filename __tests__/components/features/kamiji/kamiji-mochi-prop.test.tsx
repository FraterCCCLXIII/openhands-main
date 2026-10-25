import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "test-utils";
import { KamijiMochi } from "#/components/features/kamiji/kamiji-mochi";
import { KamijiProp } from "#/components/features/kamiji/kamiji-prop";
import {
  KAMIJI_MOCHI_IDS,
  KAMIJI_PROP_NAMES,
} from "#/components/features/kamiji/kamiji-catalog";

describe("catalogue", () => {
  it("lists all 14 mochi and 38 props (24 general, 14 git)", () => {
    expect(KAMIJI_MOCHI_IDS).toHaveLength(14);
    expect(KAMIJI_PROP_NAMES).toHaveLength(38);
  });
});

describe("KamijiMochi", () => {
  it("shows the flat fallback in the requested colour when WebGL is unavailable", async () => {
    const { container } = renderWithProviders(
      <KamijiMochi character="kamikin-hana" color="#4f8cff" size={40} />,
    );

    expect(screen.getByRole("img")).toHaveAttribute("aria-label", "hana");
    await waitFor(() => expect(container.querySelector("canvas")).toBeNull());
    expect(container.querySelector("svg g")).toHaveAttribute("fill", "#4f8cff");
  });
});

describe("KamijiProp", () => {
  it("shows a fallback chip in the prop's suggested tint when WebGL is unavailable", async () => {
    const { container } = renderWithProviders(<KamijiProp name="heart" />);

    await waitFor(() => expect(container.querySelector("canvas")).toBeNull());
    expect(container.querySelector("rect")).toHaveAttribute("fill", "#ff5a7a");
  });
});
