"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { DashboardWorkspace } from "@/src/components/dashboard/workspace";
import { ServiceUnavailableScreen } from "@/src/components/feedback/service-unavailable-screen";
import { useAuth } from "@/src/components/auth/auth-context";
import { fetchJson } from "@/src/lib/fetch-json";
import type {
  AccessRequest,
  AdminApiKeyStatus,
  IntegrationSpec,
  UserApiKeyStatus,
} from "@/src/types/integrations-hub";

// API response wrappers - the actual /api/user/key and /api/admin/key responses
interface UserKeyApiResponse {
  hasKey: boolean;
  key: UserApiKeyStatus | null;
  apiKey: string | null;
}

interface AdminKeyApiResponse {
  hasKey: boolean;
  key: AdminApiKeyStatus | null;
  apiKey: string | null;
}

interface InitialDataResponse {
  integrations: IntegrationSpec[];
  accessRequests: AccessRequest[];
  contextApiKey: string;
  userApiKey: UserApiKeyStatus | null;
  adminApiKey: AdminApiKeyStatus | null;
}

function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        <p className="text-sm text-[var(--color-text-base)]">Loading dashboard...</p>
      </div>
    </div>
  );
}

/**
 * Client-side dashboard page that fetches all data client-side.
 * This replaces the server component version for SPA mode.
 */
export function ClientDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading: authLoading, isAuthenticated, authDisabled } = useAuth();

  // Redirect to signin if not authenticated (only when auth is enabled)
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !authDisabled) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, authDisabled, router]);

  // Fetch initial dashboard data
  const { data, isLoading: dataLoading, error } = useQuery({
    queryKey: ["dashboard-init", isAdmin],
    queryFn: async (): Promise<InitialDataResponse> => {
      const [integrations, accessRequests, agentKeyRes, userKeyRes, adminKeyRes] =
        await Promise.all([
          fetchJson<IntegrationSpec[]>("/api/integrations"),
          fetchJson<AccessRequest[]>("/api/case-by-case-approvals"),
          fetchJson<{ apiKey: string | null }>("/api/user/agent-key"),
          fetchJson<UserKeyApiResponse>("/api/user/key").catch(() => null),
          isAdmin
            ? fetchJson<AdminKeyApiResponse>("/api/admin/key").catch(() => null)
            : Promise.resolve(null),
        ]);

      return {
        integrations,
        accessRequests,
        contextApiKey: agentKeyRes.apiKey ?? "",
        // Extract the nested 'key' property from the API response wrapper
        userApiKey: userKeyRes?.key ?? null,
        adminApiKey: adminKeyRes?.key ?? null,
      };
    },
    enabled: isAuthenticated || authDisabled,
    staleTime: 0,
    retry: false,
  });

  // Get base URL from window
  const contextApiBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  // Loading states
  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated && !authDisabled) {
    return <LoadingSpinner />;
  }

  // Error state - show service unavailable with error details
  if (error) {
    console.error("Dashboard data fetch error:", error);
    return <ServiceUnavailableScreen isAdmin={isAdmin} />;
  }

  if (dataLoading || !data) {
    return <LoadingSpinner />;
  }

  const currentUser = {
    name: user?.name,
    email: user?.email,
  };

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <DashboardWorkspace
          currentUser={currentUser}
          initialIntegrations={data.integrations}
          initialAccessRequests={data.accessRequests}
          contextApiBaseUrl={contextApiBaseUrl}
          contextApiKey={data.contextApiKey}
          userApiKey={data.userApiKey}
          adminApiKey={data.adminApiKey}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
