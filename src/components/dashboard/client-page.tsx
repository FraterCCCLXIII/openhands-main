"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { DashboardWorkspace } from "@/src/components/dashboard/workspace";
import { LoadingSpinner } from "@/src/components/feedback/loading-spinner";
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
  agentApiKey: string;
  userApiKey: UserApiKeyStatus | null;
  adminApiKey: AdminApiKeyStatus | null;
}

/**
 * Client-side dashboard page that fetches all data client-side.
 * This replaces the server component version for SPA mode.
 */
export function ClientDashboardPage() {
  const router = useRouter();
  const {
    user,
    isAdmin,
    isLoading: authLoading,
    isAuthenticated,
    authDisabled,
    sessionError,
    retrySession,
  } = useAuth();

  // Redirect to signin only on a definitive auth failure (no token / 401-403).
  // A transient sessionError (503 / network) must NOT redirect — the stored
  // long-lived token is still valid and the user should retry instead of
  // being forced to log in again.
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !authDisabled && !sessionError) {
      router.push("/signin");
    }
  }, [authLoading, isAuthenticated, authDisabled, sessionError, router]);

  // Fetch initial dashboard data
  const { data, isLoading: dataLoading, isFetching, error, refetch } = useQuery({
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
        agentApiKey: agentKeyRes.apiKey ?? "",
        // Extract the nested 'key' property from the API response wrapper
        userApiKey: userKeyRes?.key ?? null,
        adminApiKey: adminKeyRes?.key ?? null,
      };
    },
    enabled: isAuthenticated || authDisabled,
    // self-heal after transient failures
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 8_000),
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Get base URL from window
  const agentApiBaseUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  // Loading states
  if (authLoading) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  // Transient session failure (503 / network): the stored token is preserved,
  // so offer a retry instead of bouncing to /signin (which would force a
  // re-login for a still-valid long-lived API key).
  if (!authDisabled && sessionError && !isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-12">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)]">
            <span className="text-2xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Couldn't reach OpenHands Cloud
          </h1>
          <p className="text-sm leading-7 text-[var(--color-text-base)]">
            Your session is still saved. The network or OpenHands Cloud was
            briefly unavailable. Try again — you won't need to log back in.
          </p>
          <button
            type="button"
            onClick={retrySession}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  if (!isAuthenticated && !authDisabled) {
    return <LoadingSpinner label="Loading dashboard..." />;
  }

  // Error state - show service unavailable with error details
  if (error) {
    console.error("Dashboard data fetch error:", error);
    return (
      <ServiceUnavailableScreen
        isAdmin={isAdmin}
        onRetry={() => {
          void refetch();
        }}
        isRetrying={isFetching}
      />
    );
  }

  if (dataLoading || !data) {
    return <LoadingSpinner label="Loading dashboard..." />;
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
          agentApiBaseUrl={agentApiBaseUrl}
          agentApiKey={data.agentApiKey}
          userApiKey={data.userApiKey}
          adminApiKey={data.adminApiKey}
          isAdmin={isAdmin}
        />
      </div>
    </main>
  );
}
