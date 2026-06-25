// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearStoredOpenHandsToken, setStoredOpenHandsToken } from "@/src/lib/cloud-auth-storage";
import { useClientAuth } from "@/src/lib/client-auth";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

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
    clearStoredOpenHandsToken();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    clearStoredOpenHandsToken();
    vi.restoreAllMocks();
  });

  it("uses the admin flag returned by the backend session", async () => {
    setStoredOpenHandsToken("oh-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({
        user: { name: "Admin", email: "admin@example.com", isAdmin: true },
      }),
    );

    let isAdmin = false;
    await act(async () => {
      root.render(<AuthProbe onAuth={(value) => { isAdmin = value; }} />);
    });
    await act(async () => undefined);

    expect(isAdmin).toBe(true);
  });

  it("does not infer admin status from client environment variables", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    setStoredOpenHandsToken("oh-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ user: { name: "Admin", email: "admin@example.com" } }),
    );

    let isAdmin = true;
    await act(async () => {
      root.render(<AuthProbe onAuth={(value) => { isAdmin = value; }} />);
    });
    await act(async () => undefined);

    expect(isAdmin).toBe(false);
  });
});
