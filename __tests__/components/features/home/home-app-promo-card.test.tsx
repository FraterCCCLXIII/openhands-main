import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HomeAppPromoCard } from "#/components/features/home/home-app-promo-card";
import {
  HOME_APP_PROMO_DISMISSED_STORAGE_KEY,
  HOME_APP_PROMO_DOWNLOAD_URL,
} from "#/components/features/home/home-app-promo.constants";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("HomeAppPromoCard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("offers the phone app download link", () => {
    render(<HomeAppPromoCard />);

    expect(screen.getByText("HOME$PHONE_APP_TITLE")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "HOME$PHONE_APP_GET_APP" }),
    ).toHaveAttribute("href", HOME_APP_PROMO_DOWNLOAD_URL);
  });

  it("hides itself on dismiss and stays hidden on the next visit", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<HomeAppPromoCard />);

    await user.click(
      screen.getByRole("button", { name: "HOME$PHONE_APP_DISMISS_LABEL" }),
    );

    expect(screen.queryByTestId("home-app-promo")).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem(HOME_APP_PROMO_DISMISSED_STORAGE_KEY),
    ).toBe("true");

    unmount();
    render(<HomeAppPromoCard />);

    expect(screen.queryByTestId("home-app-promo")).not.toBeInTheDocument();
  });
});
