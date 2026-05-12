"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

import { AuthProvider } from "@/src/components/auth/auth-context";

export const Providers = ({
  children,
  authDisabled = false,
}: {
  children: React.ReactNode;
  authDisabled?: boolean;
}) => {
  const [queryClient] = useState(() => new QueryClient());

  // Always wrap with SessionProvider to satisfy React hook rules.
  // When auth is disabled, the session won't be fetched, but the provider
  // must still be present since hooks must be called unconditionally.
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider authDisabled={authDisabled}>{children}</AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
};
