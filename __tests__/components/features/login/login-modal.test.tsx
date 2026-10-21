import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginModal } from "#/components/features/login/login-modal";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    ready: true,
    t: (key: string) => key,
  }),
}));

vi.mock("#/i18n", () => ({
  OPENHANDS_I18N_NAMESPACE: "openhands",
}));

describe("LoginModal", () => {
  it("offers every sign-in method and a skip action", () => {
    // Arrange
    render(<LoginModal onSignIn={vi.fn()} onSkip={vi.fn()} />);

    // Act
    const buttonNames = screen
      .getAllByRole("button")
      .map((button) => button.textContent);

    // Assert
    expect(buttonNames).toEqual([
      "LOGIN$SIGN_IN_WITH_CHATGPT",
      "LOGIN$SIGN_IN_WITH_GOOGLE",
      "LOGIN$SIGN_IN_WITH_APPLE",
      "LOGIN$SIGN_IN_WITH_MICROSOFT",
      "LOGIN$CONTINUE_WITH_EMAIL",
      "LOGIN$SKIP_ACCOUNT_CONNECT",
    ]);
  });

  it("reports the chosen sign-in method", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    render(<LoginModal onSignIn={onSignIn} onSkip={vi.fn()} />);

    // Act
    await user.click(
      screen.getByRole("button", { name: "LOGIN$SIGN_IN_WITH_GOOGLE" }),
    );

    // Assert
    expect(onSignIn).toHaveBeenCalledWith("google");
  });

  it("skips account connect without signing in", async () => {
    // Arrange
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    const onSkip = vi.fn();
    render(<LoginModal onSignIn={onSignIn} onSkip={onSkip} />);

    // Act
    await user.click(
      screen.getByRole("button", { name: "LOGIN$SKIP_ACCOUNT_CONNECT" }),
    );

    // Assert
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onSignIn).not.toHaveBeenCalled();
  });
});
