"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/src/lib/fetch-json";
import {
  ADMIN_INTEGRATION_REQUESTS_QUERY_KEY,
  isPendingIntegrationRequest,
} from "@/src/lib/integration-requests";
import type { IntegrationRequest } from "@/src/types/integrations-hub";

export function usePendingUserRequestsCount(options?: { enabled?: boolean }) {
  const { data = [] } = useQuery({
    queryKey: ADMIN_INTEGRATION_REQUESTS_QUERY_KEY,
    queryFn: () => fetchJson<IntegrationRequest[]>("/api/admin/integration-requests"),
    enabled: options?.enabled ?? true,
  });

  return data.filter(isPendingIntegrationRequest).length;
}
