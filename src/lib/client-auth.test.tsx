// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearStoredOpenHandsToken, getStoredOpenHandsToken, setStoredOpenHandsToken } from "@/src/lib/cloud-auth-storage";
import { useClientAuth } from "@/src/lib/client-auth";
import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

enableReactActEnvironment();

interface AuthSnapshot {
  isAuthenticated: boolean;
  isAdmin: boolean;
  sessionError: Error | null;
}

const AuthProbe = ({
  onAuth,
  probeKey,
}: {
  onAuth: (snapshot: AuthSnapshot) => void;
  probeKey?: number;
}) => {
  const auth = useClientAuth();
  // probeKey forces re-render/re-report when the caller triggers retrySession.
  void probeKey;
  onAuth({
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    sessionError: auth.sessionError,
  });
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

    let snapshot: AuthSnapshot = { isAuthenticated: false, isAdmin: false, sessionError: null };
    await act(async () => {
      root.render(<AuthProbe onAuth={(value) => { snapshot = value; }} />);
    });
    await act(async () => undefined);

    expect(snapshot.isAuthenticated).toBe(true);
    expect(snapshot.isAdmin).toBe(true);
  });

  it("does not infer admin status from client environment variables", async () => {
    vi.stubEnv("INTHUB_APP_ADMIN_EMAILS", "admin@example.com");
    setStoredOpenHandsToken("oh-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ user: { name: "Admin", email: "admin@example.com" } }),
    );

    let snapshot: AuthSnapshot = { isAuthenticated: false, isAdmin: true, sessionError: null };
    await act(async () => {
      root.render(<AuthProbe onAuth={(value) => { snapshot = value; }} />);
    });
    await act(async () => undefined);

    expect(snapshot.isAuthenticated).toBe(true);
    expect(snapshot.isAdmin).toBe(false);
  });

  it("preserves the stored token on a transient 503 (no forced re-login) (#295)", async () => {
    setStoredOpenHandsToken("still-valid-long-lived-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ detail: "temporarily unavailable" }, { status: 503 }),
    );

    let snapshot: AuthSnapshot = { isAuthenticated: false, isAdmin: false, sessionError: null };
    await act(async () => {
      root.render(<AuthProbe onAuth={(value) => { snapshot = value; }} />);
    });
    await act(async () => undefined);

    expect(snapshot.isAuthenticated).toBe(false);
    expect(snapshot.sessionError).toBeInstanceOf(Error);
    // The key assertion: the long-lived token is NOT deleted on a transient failure.
    expect(getStoredOpenHandsToken()).toBe("still-valid-long-lived-token");
  });

  it("clears the stored token on a definitive 401 (#295)", async () => {
    setStoredOpenHandsToken("revoked-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ detail: "Sign in with OpenHands Cloud." }, { status: 401 }),
    );

    let snapshot: AuthSnapshot = { isAuthenticated: false, isAdmin: false, sessionError: null };
    await act(async () => {
      root.render(<AuthProbe onAuth={(value) => { snapshot = value; }} />);
    });
    await act(async () => undefined);

    expect(snapshot.isAuthenticated).toBe(false);
    expect(snapshot.sessionError).toBeNull();
    expect(getStoredOpenHandsToken()).toBeNull();
  });
});
