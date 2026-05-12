// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

interface AuthContextValue {
  user: { name?: string | null; email?: string | null } | null;
  ownerId: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  authDisabled: boolean;
}

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn() as Mock<() => AuthContextValue>,
}));

vi.mock("@/src/components/auth/auth-context", () => ({
  useAuth: useAuthMock,
}));

import HomePage from "./page";

describe("HomePage", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    useAuthMock.mockReset();
    useAuthMock.mockReturnValue({
      user: { name: "User", email: "user@example.com" },
      ownerId: "user@example.com",
      isAdmin: false,
      isLoading: false,
      isAuthenticated: true,
      authDisabled: false,
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("links signed-in users to the /integrations dashboard route", async () => {
    await act(async () => {
      root.render(<HomePage />);
    });

    const dashboardLink = container.querySelector('a[href="/integrations"]');
    expect(dashboardLink).toBeTruthy();
    expect(dashboardLink?.textContent).toContain("Open dashboard");
  });

  it("links non-authenticated users to /signin", async () => {
    useAuthMock.mockReturnValue({
      user: null,
      ownerId: null,
      isAdmin: false,
      isLoading: false,
      isAuthenticated: false,
      authDisabled: false,
    });

    await act(async () => {
      root.render(<HomePage />);
    });

    const signInLink = container.querySelector('a[href="/signin"]');
    expect(signInLink).toBeTruthy();
    expect(signInLink?.textContent).toContain("Sign in to configure");
  });

  it("shows loading state while auth is loading", async () => {
    useAuthMock.mockReturnValue({
      user: null,
      ownerId: null,
      isAdmin: false,
      isLoading: true,
      isAuthenticated: false,
      authDisabled: false,
    });

    await act(async () => {
      root.render(<HomePage />);
    });

    const button = container.querySelector("button");
    expect(button?.textContent).toContain("Loading...");
  });
});
