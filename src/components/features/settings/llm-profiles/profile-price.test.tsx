import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "test-utils";
import { ProfilePrice } from "./profile-price";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, string>) =>
      ({
        SETTINGS$MODEL_PRICE_LINE: `${vars?.input} in · ${vars?.output} out / 1M tokens`,
        SETTINGS$MODEL_PRICE_UNKNOWN: "Price unknown",
        SETTINGS$MODEL_PRICE_UNKNOWN_TOOLTIP:
          "No price in the matrix for this model",
        SETTINGS$MODEL_PRICE_TOOLTIP: `Per token: ${vars?.input} / ${vars?.output}`,
        SETTINGS$MODEL_PRICE_TOOLTIP_CACHED: `Cached: ${vars?.cached}`,
        SETTINGS$MODEL_PRICE_TOOLTIP_SOURCE: `Source: ${vars?.source}`,
      })[key] ?? key,
  }),
}));

describe("ProfilePrice", () => {
  it("shows input and output price per 1M tokens for a known model", () => {
    renderWithProviders(<ProfilePrice model="openhands/claude-sonnet-5-5" />);

    const price = screen.getByTestId("profile-price");
    expect(price).toHaveTextContent("$2 in · $10 out / 1M tokens");
    expect(price.title).toContain("$0.000002");
    expect(price.title).toContain("kosmos-engine");
  });

  it("shows 'Price unknown' and no number for an unknown model", () => {
    renderWithProviders(<ProfilePrice model="openhands/not-a-real-model" />);

    const unknown = screen.getByTestId("profile-price-unknown");
    expect(unknown).toHaveTextContent("Price unknown");
    expect(unknown).not.toHaveTextContent("$");
    expect(unknown.title).toBe("No price in the matrix for this model");
  });
});
