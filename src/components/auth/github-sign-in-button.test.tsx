// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { signInMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

import { GitHubSignInButton } from "@/src/components/auth/github-sign-in-button";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("GitHubSignInButton", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    signInMock.mockReset();
  });

  it("starts the GitHub OAuth flow with the admin callback URL", async () => {
    await act(async () => {
      root.render(<GitHubSignInButton callbackUrl="/admin" />);
    });

    const button = container.querySelector("button");
    expect(button?.textContent).toBe("Continue with GitHub");

    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(signInMock).toHaveBeenCalledWith("github", { callbackUrl: "/admin" });
  });
});
