"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

import { useClientAuth, type ClientAuthState } from "@/src/lib/client-auth";

declare global {
  interface Window {
    __INTEGRATIONS_HUB_OWNER_ID__?: string;
  }
}

interface AuthContextValue extends ClientAuthState {
  authDisabled: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  authDisabled?: boolean;
}

export function AuthProvider({ children, authDisabled = false }: AuthProviderProps) {
  const authState = useClientAuth(authDisabled);

  const value = useMemo(
    () => ({
      ...authState,
      authDisabled,
    }),
    [authState, authDisabled],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (value.ownerId) {
      window.__INTEGRATIONS_HUB_OWNER_ID__ = value.ownerId;
      return;
    }

    delete window.__INTEGRATIONS_HUB_OWNER_ID__;
  }, [value.ownerId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
