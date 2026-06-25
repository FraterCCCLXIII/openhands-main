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
  signInWithOpenHandsToken: (token: string) => void;
  signOut: () => void;
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

async function fetchSession(token: string, signal: AbortSignal): Promise<ClientUser | null> {
  const response = await fetch("/api/auth/session", {
    method: "GET",
    credentials: "same-origin",
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });

  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error(`Session request failed with ${response.status}`);

  const body = (await response.json()) as SessionResponse;
  return body.user ?? null;
}

export function useClientAuth(authDisabled = false): ClientAuthState {
  const [token, setToken] = useState<string | null>(() => getStoredOpenHandsToken());
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(!authDisabled && Boolean(token));

  useEffect(
    () => subscribeToOpenHandsTokenChanges(() => setToken(getStoredOpenHandsToken())),
    [],
  );

  useEffect(() => {
    if (authDisabled) {
      setUser(DEV_USER);
      setIsLoading(false);
      return;
    }

    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    fetchSession(token, controller.signal)
      .then((sessionUser) => {
        if (!sessionUser) {
          clearStoredOpenHandsToken();
          setUser(null);
          return;
        }
        setUser(sessionUser);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Failed to load OpenHands session", error);
          setUser(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [authDisabled, token]);

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
        signInWithOpenHandsToken,
        signOut,
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
      signInWithOpenHandsToken,
      signOut,
    };
  }, [authDisabled, isLoading, signInWithOpenHandsToken, signOut, user]);
}

export const normalizeOwnerId = normalizeCaseInsensitiveText;
