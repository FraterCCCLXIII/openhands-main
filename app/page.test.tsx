// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

interface AuthContextValue {
  user: { name?: string | null; email?: string | null } | null;
  ownerId: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  authDisabled: boolean;
  sessionError: Error | null;
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
      sessionError: null,
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

  it("immediately redirects non-authenticated users to the main app login", async () => {
    const originalLocation = window.location;
    const replaceMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        pathname: "/integrations-hub",
        search: "",
        replace: replaceMock,
      },
    });
    useAuthMock.mockReturnValue({
      user: null,
      ownerId: null,
      isAdmin: false,
      isLoading: false,
      isAuthenticated: false,
      authDisabled: false,
      sessionError: null,
    });

    await act(async () => {
      root.render(<HomePage />);
    });

    expect(replaceMock).toHaveBeenCalledWith(
      "/login?returnTo=%2Fintegrations-hub",
    );
    expect(container.textContent).toContain("Redirecting to OpenHands sign-in");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("shows loading state while auth is loading", async () => {
    useAuthMock.mockReturnValue({
      user: null,
      ownerId: null,
      isAdmin: false,
      isLoading: true,
      isAuthenticated: false,
      authDisabled: false,
      sessionError: null,
    });

    await act(async () => {
      root.render(<HomePage />);
    });

    expect(container.textContent).toContain("Redirecting to OpenHands sign-in");
    expect(container.querySelector("button")).toBeNull();
  });
});
