"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { fetchJson } from "@/src/lib/fetch-json";
import {
  countApprovalRequestsByStatus,
  matchesAccessRequestFilter,
  matchesAccessRequestSearch,
  type ApprovalRequestFilter,
} from "@/src/components/dashboard/utils";
import {
  DEFAULT_CASE_BY_CASE_APPROVAL_HOURS,
  approvalHoursToMinutes,
  normalizeApprovalDurationHours,
} from "@/src/lib/access-requests";
import type { AccessRequest } from "@/src/types/integrations-hub";
import { useTracking } from "@/src/hooks/use-tracking";

interface UseApprovalsSectionOptions {
  initialAccessRequests?: AccessRequest[];
  enabled: boolean;
  onStatus: (message: string | null) => void;
}

export const useApprovalsSection = ({
  initialAccessRequests = [],
  enabled,
  onStatus,
}: UseApprovalsSectionOptions) => {
  const queryClient = useQueryClient();
  const { track } = useTracking();
  const [approvalSearch, setApprovalSearch] = useState("");
  const [approvalFilter, setApprovalFilter] =
    useState<ApprovalRequestFilter>("pending");
  const [selectedApprovalRequests, setSelectedApprovalRequests] = useState<
    Record<string, boolean>
  >({});
  const [requestActionPending, setRequestActionPending] = useState(false);

  const accessRequestsQuery = useQuery({
    queryKey: ["access-requests"],
    queryFn: () => fetchJson<AccessRequest[]>("/api/case-by-case-approvals"),
    initialData: initialAccessRequests,
    enabled,
    staleTime: 0,
    refetchInterval: 5_000,
    refetchIntervalInBackground: false,
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["integrations"] }),
      queryClient.invalidateQueries({ queryKey: ["access-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["permission-profiles"] }),
    ]);
  };

  const accessRequests = accessRequestsQuery.data ?? [];

  const sortedAccessRequests = useMemo(
    () =>
      [...accessRequests].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [accessRequests],
  );
  const filteredAccessRequests = useMemo(
    () =>
      sortedAccessRequests.filter(
        (request) =>
          matchesAccessRequestFilter(request, approvalFilter) &&
          matchesAccessRequestSearch(request, approvalSearch),
      ),
    [approvalFilter, approvalSearch, sortedAccessRequests],
  );
  const approvalCounts = useMemo(
    () => countApprovalRequestsByStatus(accessRequests),
    [accessRequests],
  );
  const selectedApprovalRequestIds = filteredAccessRequests
    .filter((request) => selectedApprovalRequests[request.id])
    .map((request) => request.id);
  const hasVisibleApprovalRequests = filteredAccessRequests.length > 0;
  const allVisibleApprovalRequestsSelected =
    hasVisibleApprovalRequests &&
    filteredAccessRequests.every((request) => selectedApprovalRequests[request.id]);
  const selectedApprovalRequestCount = selectedApprovalRequestIds.length;

  const setSelectedStateForApprovalRequests = (
    requestIds: string[],
    selected: boolean,
  ) => {
    setSelectedApprovalRequests((current) => {
      const next = { ...current };
      for (const requestId of requestIds) {
        if (selected) {
          next[requestId] = true;
        } else {
          delete next[requestId];
        }
      }
      return next;
    });
  };

  const handleAccessRequestDecision = async (
    requestIds: string[],
    action: "approve" | "deny",
    durationHoursOverride?: number,
  ) => {
    if (requestIds.length === 0) {
      return;
    }

    setRequestActionPending(true);

    try {
      const decisionDurationHours =
        durationHoursOverride === undefined
          ? DEFAULT_CASE_BY_CASE_APPROVAL_HOURS
          : normalizeApprovalDurationHours(durationHoursOverride);

      for (const requestId of requestIds) {
        await fetchJson(
          `/api/case-by-case-approvals/${requestId}/${action === "approve" ? "approve" : "reject"}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body:
              action === "approve"
                ? JSON.stringify({
                    durationMinutes: approvalHoursToMinutes(
                      decisionDurationHours,
                    ),
                  })
                : JSON.stringify({}),
          },
        );
      }

      setSelectedApprovalRequests((current) => {
        const next = { ...current };
        for (const requestId of requestIds) {
          delete next[requestId];
        }
        return next;
      });
      onStatus(
        action === "approve"
          ? `Approved ${requestIds.length} request${requestIds.length === 1 ? "" : "s"}.`
          : `Denied ${requestIds.length} request${requestIds.length === 1 ? "" : "s"}.`,
      );
      track("access_request_resolved", {
        decision: action === "approve" ? "approved" : "rejected",
        request_count: requestIds.length,
      });
      await invalidateAll();
    } catch (error) {
      onStatus(
        error instanceof Error ? error.message : "Unable to update access request.",
      );
    } finally {
      setRequestActionPending(false);
    }
  };

  return {
    allVisibleApprovalRequestsSelected,
    approvalCounts,
    approvalFilter,
    approvalSearch,
    filteredAccessRequests,
    handleAccessRequestDecision,
    hasVisibleApprovalRequests,
    requestActionPending,
    selectedApprovalRequestCount,
    selectedApprovalRequestIds,
    selectedApprovalRequests,
    setApprovalFilter,
    setApprovalSearch,
    setSelectedStateForApprovalRequests,
  };
};
