"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { normalizeCaseInsensitiveText } from "@/src/lib/text-utils";
import { isUxReviewMode } from "@/src/lib/ux-review-mode";
import { apiPath } from "@/src/shared/paths";

interface ClientUser {
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
  sessionError: Error | null;
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
  signal: AbortSignal,
): Promise<{ user: ClientUser | null; status: number }> {
  const response = await fetch(apiPath("/api/auth/session"), {
    method: "GET",
    credentials: "same-origin",
    signal,
  });

  if (response.status === 401 || response.status === 403) {
    return { user: null, status: response.status };
  }
  if (!response.ok) {
    throw new Error(`Session request failed with ${response.status}`);
  }

  const body = (await response.json()) as SessionResponse;
  return { user: body.user ?? null, status: response.status };
}

export function useClientAuth(
  authDisabled = false,
  uxReviewViewAsAdmin = true,
): ClientAuthState {
  const effectiveAuthDisabled = authDisabled || isUxReviewMode();
  const [user, setUser] = useState<ClientUser | null>(null);
  const [sessionError, setSessionError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(!effectiveAuthDisabled);

  useEffect(() => {
    if (effectiveAuthDisabled) {
      setUser(DEV_USER);
      setSessionError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    fetchSession(controller.signal)
      .then(({ user: sessionUser }) => {
        if (controller.signal.aborted) return;
        setUser(sessionUser);
        setSessionError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("Failed to load OpenHands session", error);
        setSessionError(error instanceof Error ? error : new Error(String(error)));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [effectiveAuthDisabled, retryCount]);

  const retrySession = useCallback(() => setRetryCount((n) => n + 1), []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  return useMemo(() => {
    if (effectiveAuthDisabled) {
      return {
        user: DEV_USER,
        ownerId: DEV_OWNER_ID,
        isAdmin: isUxReviewMode() ? uxReviewViewAsAdmin : true,
        isLoading: false,
        isAuthenticated: true,
        sessionError: null,
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
      signOut,
      retrySession,
    };
  }, [
    effectiveAuthDisabled,
    isLoading,
    retrySession,
    sessionError,
    signOut,
    user,
    uxReviewViewAsAdmin,
  ]);
}
