"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { AuthProvider } from "@/src/components/auth/auth-context";
import { PostHogAnalytics } from "@/src/components/analytics/posthog-analytics";

export const Providers = ({
  children,
  authDisabled = false,
}: {
  children: React.ReactNode;
  authDisabled?: boolean;
}) => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider authDisabled={authDisabled}>
        <PostHogAnalytics />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};
