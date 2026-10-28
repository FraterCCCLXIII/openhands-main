import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileAppSetupSection } from "#/components/features/settings/app-settings/mobile-app-setup-section";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("MobileAppSetupSection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("links to the mobile repository in a new tab safely", () => {
    render(<MobileAppSetupSection />);

    const link = screen.getByTestId("mobile-app-repo-link");
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/OpenHands/openhands-mobile",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("copies the install commands", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue(undefined);
    render(<MobileAppSetupSection />);

    await user.click(screen.getByTestId("copy-to-clipboard"));

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining("npm install"),
    );
  });
});
