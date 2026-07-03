"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/src/lib/fetch-json";
import type { AccessRequest } from "@/src/types/integrations-hub";

export const PENDING_APPROVALS_QUERY_KEY = ["access-requests"] as const;

function countPendingApprovals(requests: unknown): number {
  if (!Array.isArray(requests)) {
    return 0;
  }

  return requests.filter((request: AccessRequest) => request.status === "pending").length;
}

export function usePendingApprovalsCount(options?: { enabled?: boolean }) {
  const { data = [] } = useQuery({
    queryKey: PENDING_APPROVALS_QUERY_KEY,
    queryFn: () => fetchJson<AccessRequest[]>("/api/case-by-case-approvals"),
    enabled: options?.enabled ?? true,
  });

  return countPendingApprovals(data);
}
