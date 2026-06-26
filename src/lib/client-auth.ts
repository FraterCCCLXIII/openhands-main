"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  clearStoredOpenHandsToken,
  getStoredOpenHandsToken,
  setStoredOpenHandsToken,
  subscribeToOpenHandsTokenChanges,
} from "@/src/lib/cloud-auth-storage";
import { normalizeCaseInsensitiveText } from "@/src/lib/text-utils";

export interface ClientUser {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  ownerId?: string | null;
  orgId?: string | null;
  orgName?: string | null;
  role?: string | null;
  permissions?: string[] | null;
  isAdmin?: boolean | null;
}

export interface ClientAuthState {
  user: ClientUser | null;
  ownerId: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Set when the session check failed transiently (503/network). The stored
   * token is preserved; the UI should offer a retry rather than redirecting
   * to /signin. Cleared on a successful check or a definitive 401/403. */
  sessionError: Error | null;
  signInWithOpenHandsToken: (token: string) => void;
  signOut: () => void;
  retrySession: () => void;
}

interface SessionResponse {
  user?: ClientUser | null;
}

const DEV_USER: ClientUser = {
  name: "Local Dev User",
  email: "dev@localhost",
  isAdmin: true,
};

const DEV_OWNER_ID = "dev@localhost";

async function fetchSession(
  token: string,
  signal: AbortSignal,
): Promise<{ user: ClientUser | null; status: number }> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "same-origin",
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  // 401/403 => the token is genuinely invalid; the caller should clear it.
  if (response.status === 401 || response.status === 403) {
    return { user: null, status: response.status };
  }
  // 503 / network error / other non-ok => transient or infra failure; do NOT
  // destroy the stored long-lived API key. Surface a retryable error instead.
  if (!response.ok) {
    throw new Error(`Session request failed with ${response.status}`);
  }

  const body = (await response.json()) as SessionResponse;
  return { user: body.user ?? null, status: response.status };
}

export function useClientAuth(authDisabled = false): ClientAuthState {
  const [token, setToken] = useState<string | null>(() => getStoredOpenHandsToken());
  const [user, setUser] = useState<ClientUser | null>(null);
  const [sessionError, setSessionError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(!authDisabled && Boolean(token));

  useEffect(
    () => subscribeToOpenHandsTokenChanges(() => setToken(getStoredOpenHandsToken())),
    [],
  );

  useEffect(() => {
    if (authDisabled) {
      setUser(DEV_USER);
      setSessionError(null);
      setIsLoading(false);
      return;
    }

    if (!token) {
      setUser(null);
      setSessionError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    fetchSession(token, controller.signal)
      .then(({ user: sessionUser, status }) => {
        if (controller.signal.aborted) return;
        // Only wipe the stored token on a definitive auth rejection (401/403).
        // Transient/infra failures (503, network) throw and are handled below,
        // preserving the long-lived API key so the user isn't forced to re-login.
        if (status === 401 || status === 403) {
          clearStoredOpenHandsToken();
          setUser(null);
          setSessionError(null);
          return;
        }
        setUser(sessionUser);
        setSessionError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load OpenHands session", error);
        // Keep the stored token and any previously resolved user; surface a
        // retryable session error instead of logging the user out.
        setSessionError(error instanceof Error ? error : new Error(String(error)));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [authDisabled, token, retryCount]);

  const retrySession = useCallback(() => setRetryCount((n) => n + 1), []);

  const signInWithOpenHandsToken = useCallback((nextToken: string) => {
    setStoredOpenHandsToken(nextToken);
    setToken(nextToken.trim() || null);
  }, []);

  const signOut = useCallback(() => {
    clearStoredOpenHandsToken();
    setToken(null);
    setUser(null);
  }, []);

  return useMemo(() => {
    if (authDisabled) {
      return {
        user: DEV_USER,
        ownerId: DEV_OWNER_ID,
        isAdmin: true,
        isLoading: false,
        isAuthenticated: true,
        sessionError: null,
        signInWithOpenHandsToken,
        signOut,
        retrySession,
      };
    }

    const ownerId = user?.ownerId
      ? normalizeCaseInsensitiveText(user.ownerId.trim())
      : user?.email
        ? normalizeCaseInsensitiveText(user.email.trim())
        : user?.name
          ? normalizeCaseInsensitiveText(user.name.trim())
          : null;

    return {
      user,
      ownerId,
      isAdmin: Boolean(user?.isAdmin),
      isLoading,
      isAuthenticated: Boolean(user),
      sessionError,
      signInWithOpenHandsToken,
      signOut,
      retrySession,
    };
  }, [
    authDisabled,
    isLoading,
    retrySession,
    sessionError,
    signInWithOpenHandsToken,
    signOut,
    user,
  ]);
}

export const normalizeOwnerId = normalizeCaseInsensitiveText;
