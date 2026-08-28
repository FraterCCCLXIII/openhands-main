"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "react-hot-toast";

import { PostHogAnalytics } from "@/src/components/analytics/posthog-analytics";
import { AuthProvider } from "@/src/components/auth/auth-context";
import { UxReviewBanner } from "@/src/components/feedback/ux-review-banner";
import { TOAST_OPTIONS } from "@/src/utils/custom-toast-handlers";

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
        <UxReviewBanner />
        <Toaster
          position="top-right"
          toastOptions={TOAST_OPTIONS}
        />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
};
