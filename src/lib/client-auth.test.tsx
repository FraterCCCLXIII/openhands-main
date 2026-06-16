// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useClientAuth } from "@/src/lib/client-auth";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => useSessionMock(),
}));

const AuthProbe = ({ onAuth }: { onAuth: (isAdmin: boolean) => void }) => {
  const auth = useClientAuth();
  onAuth(auth.isAdmin);
  return null;
};

describe("useClientAuth", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    useSessionMock.mockReset();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllEnvs();
  });

  it("uses the admin flag from the server session", async () => {
    useSessionMock.mockReturnValue({
      data: {
        user: {
          name: "Admin",
          email: "admin@example.com",
          isAdmin: true,
        },
      },
      status: "authenticated",
    });

    let isAdmin = false;
    await act(async () => {
      root.render(<AuthProbe onAuth={(value) => { isAdmin = value; }} />);
    });

    expect(isAdmin).toBe(true);
  });

  it("does not evaluate APP_ADMIN_EMAILS in the client hook", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    useSessionMock.mockReturnValue({
      data: {
        user: {
          name: "Admin",
          email: "admin@example.com",
        },
      },
      status: "authenticated",
    });

    let isAdmin = true;
    await act(async () => {
      root.render(<AuthProbe onAuth={(value) => { isAdmin = value; }} />);
    });

    expect(isAdmin).toBe(false);
  });
});
