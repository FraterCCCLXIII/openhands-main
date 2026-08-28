"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useClientAuth, type ClientAuthState } from "@/src/lib/client-auth";
import {
  isUxReviewMode,
  readUxReviewViewAsAdmin,
  writeUxReviewViewAsAdmin,
} from "@/src/lib/ux-review-mode";

declare global {
  interface Window {
    __INTEGRATIONS_HUB_OWNER_ID__?: string;
  }
}

interface AuthContextValue extends ClientAuthState {
  authDisabled: boolean;
  uxReviewViewAsAdmin?: boolean;
  toggleUxReviewViewAsAdmin?: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  authDisabled?: boolean;
}

export function AuthProvider({ children, authDisabled = false }: AuthProviderProps) {
  const effectiveAuthDisabled = authDisabled || isUxReviewMode();
  const uxReviewEnabled = isUxReviewMode();
  const [uxReviewViewAsAdmin, setUxReviewViewAsAdmin] = useState(true);

  useEffect(() => {
    if (!uxReviewEnabled) {
      return;
    }

    setUxReviewViewAsAdmin(readUxReviewViewAsAdmin());
  }, [uxReviewEnabled]);

  const toggleUxReviewViewAsAdmin = useCallback(() => {
    setUxReviewViewAsAdmin((current) => {
      const next = !current;
      writeUxReviewViewAsAdmin(next);
      return next;
    });
  }, []);

  const authState = useClientAuth(effectiveAuthDisabled, uxReviewViewAsAdmin);

  const value = useMemo(
    () => ({
      ...authState,
      authDisabled: effectiveAuthDisabled,
      ...(uxReviewEnabled
        ? {
            uxReviewViewAsAdmin,
            toggleUxReviewViewAsAdmin,
          }
        : {}),
    }),
    [
      authState,
      effectiveAuthDisabled,
      toggleUxReviewViewAsAdmin,
      uxReviewEnabled,
      uxReviewViewAsAdmin,
    ],
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
