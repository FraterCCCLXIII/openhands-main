"use client";

import { useSession } from "next-auth/react";
import { useMemo } from "react";

import { normalizeCaseInsensitiveText } from "@/src/lib/text-utils";

export interface ClientUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  isAdmin?: boolean | null;
}

export interface ClientAuthState {
  user: ClientUser | null;
  ownerId: string | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const DEV_USER: ClientUser = {
  name: "Local Dev User",
  email: "dev@localhost",
};

const DEV_OWNER_ID = "dev@localhost";

/**
 * Client-side hook for accessing the current user session.
 * Falls back to a mock dev user when auth is disabled.
 *
 * In SPA mode (static export), this hook calls the /api/auth/session endpoint
 * which is served by the FastAPI backend instead of Next.js API routes.
 * The FastAPI backend implements compatible NextAuth session endpoints.
 */
export function useClientAuth(authDisabled = false): ClientAuthState {
  const { data: session, status } = useSession();

  return useMemo(() => {
    if (authDisabled) {
      return {
        user: DEV_USER,
        ownerId: DEV_OWNER_ID,
        isAdmin: true,
        isLoading: false,
        isAuthenticated: true,
      };
    }

    const isLoading = status === "loading";
    const user = session?.user ?? null;
    const ownerId = user?.email
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
    };
  }, [authDisabled, session, status]);
}

/**
 * Normalize an owner ID for comparison.
 */
export const normalizeOwnerId = normalizeCaseInsensitiveText;
