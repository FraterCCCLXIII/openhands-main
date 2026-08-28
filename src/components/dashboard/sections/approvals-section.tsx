"use client";

import { ApprovalsPanel } from "@/src/components/approvals/approvals-panel";
import { IntegrationsSearchInput } from "@/src/components/integrations/integrations-search-input";
import { APPROVALS_PAGE_COPY } from "@/src/constants/approvals-page";
import type { ApprovalRequestFilter } from "@/src/components/dashboard/utils";
import type { AccessRequest } from "@/src/types/integrations-hub";

interface ApprovalsSectionProps {
  approvalCounts: Record<ApprovalRequestFilter, number>;
  approvalFilter: ApprovalRequestFilter;
  approvalSearch: string;
  allVisibleApprovalRequestsSelected: boolean;
  /** When false, the page is view-only: search + list, no approve/deny. */
  canDecide?: boolean;
  filteredAccessRequests: AccessRequest[];
  handleAccessRequestDecision: (
    requestIds: string[],
    action: "approve" | "deny",
    durationHoursOverride?: number,
  ) => Promise<void>;
  hasVisibleApprovalRequests: boolean;
  requestActionPending: boolean;
  selectedApprovalRequestCount: number;
  selectedApprovalRequestIds: string[];
  selectedApprovalRequests: Record<string, boolean>;
  setApprovalFilter: (value: ApprovalRequestFilter) => void;
  setApprovalSearch: (value: string) => void;
  setSelectedStateForApprovalRequests: (
    requestIds: string[],
    selected: boolean,
  ) => void;
}

export const ApprovalsSection = ({
  approvalCounts,
  approvalFilter,
  approvalSearch,
  allVisibleApprovalRequestsSelected,
  canDecide = true,
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
}: ApprovalsSectionProps) => {
  const handleToggleSelected = (requestId: string, selected: boolean) => {
    setSelectedStateForApprovalRequests([requestId], selected);
  };

  const canSelectAll =
    canDecide &&
    approvalFilter === "pending" &&
    hasVisibleApprovalRequests &&
    !allVisibleApprovalRequestsSelected;

  const canDeselect = canDecide && selectedApprovalRequestCount > 0;

  const canApprove =
    canDecide &&
    approvalFilter === "pending" &&
    selectedApprovalRequestCount > 0 &&
    !requestActionPending;

  const canDeny = canApprove;

  return (
    <div data-testid="approvals-page" className="space-y-6">
      <IntegrationsSearchInput
        testId="approvals-search"
        value={approvalSearch}
        onChange={setApprovalSearch}
        placeholder={APPROVALS_PAGE_COPY.searchPlaceholder}
        ariaLabel={APPROVALS_PAGE_COPY.searchPlaceholder}
        className="w-full"
      />

      <ApprovalsPanel
        approvalFilter={approvalFilter}
        approvalCounts={approvalCounts}
        canDecide={canDecide}
        filteredAccessRequests={filteredAccessRequests}
        requestActionPending={requestActionPending}
        selectedApprovalRequestCount={selectedApprovalRequestCount}
        selectedApprovalRequests={selectedApprovalRequests}
        onApprovalFilterChange={setApprovalFilter}
        onApproveRequests={(requestIds, durationHours) =>
          handleAccessRequestDecision(requestIds, "approve", durationHours)
        }
        onDenyRequests={(requestIds) =>
          handleAccessRequestDecision(requestIds, "deny")
        }
        onSelectAllMatches={() =>
          setSelectedStateForApprovalRequests(
            filteredAccessRequests.map((request) => request.id),
            true,
          )
        }
        onDeselectMatches={() =>
          setSelectedStateForApprovalRequests(selectedApprovalRequestIds, false)
        }
        onToggleSelected={handleToggleSelected}
        canSelectAll={canSelectAll}
        canDeselect={canDeselect}
        canApprove={canApprove}
        canDeny={canDeny}
      />
    </div>
  );
};
