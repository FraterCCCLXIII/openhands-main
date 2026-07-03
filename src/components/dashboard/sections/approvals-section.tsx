"use client";

import { ApprovalsMatchSelectionMenu } from "@/src/components/approvals/approvals-match-selection-menu";
import { ApprovalsPanel } from "@/src/components/approvals/approvals-panel";
import { IntegrationsSearchInput } from "@/src/components/integrations/integrations-search-input";
import { APPROVALS_PAGE_COPY } from "@/src/constants/approvals-page";
import type { ApprovalRequestFilter } from "@/src/components/dashboard/utils";
import type { AccessRequest } from "@/src/types/integrations-hub";

interface ApprovalsSectionProps {
  approvalCounts: Record<ApprovalRequestFilter, number>;
  approvalDurationHours: string;
  approvalFilter: ApprovalRequestFilter;
  approvalSearch: string;
  allVisibleApprovalRequestsSelected: boolean;
  filteredAccessRequests: AccessRequest[];
  handleAccessRequestDecision: (
    requestIds: string[],
    action: "approve" | "deny",
    durationHoursOverride?: number,
  ) => Promise<void>;
  handleApprovalDurationBlur: () => void;
  hasVisibleApprovalRequests: boolean;
  requestActionPending: boolean;
  selectedApprovalRequestCount: number;
  selectedApprovalRequestIds: string[];
  selectedApprovalRequests: Record<string, boolean>;
  setApprovalDurationHours: (value: string) => void;
  setApprovalFilter: (value: ApprovalRequestFilter) => void;
  setApprovalSearch: (value: string) => void;
  setSelectedStateForApprovalRequests: (
    requestIds: string[],
    selected: boolean,
  ) => void;
}

export const ApprovalsSection = ({
  approvalCounts,
  approvalDurationHours,
  approvalFilter,
  approvalSearch,
  allVisibleApprovalRequestsSelected,
  filteredAccessRequests,
  handleAccessRequestDecision,
  handleApprovalDurationBlur,
  hasVisibleApprovalRequests,
  requestActionPending,
  selectedApprovalRequestCount,
  selectedApprovalRequestIds,
  selectedApprovalRequests,
  setApprovalDurationHours,
  setApprovalFilter,
  setApprovalSearch,
  setSelectedStateForApprovalRequests,
}: ApprovalsSectionProps) => {
  const handleToggleSelected = (requestId: string, selected: boolean) => {
    setSelectedStateForApprovalRequests([requestId], selected);
  };

  const canSelectAll =
    approvalFilter === "pending" &&
    hasVisibleApprovalRequests &&
    !allVisibleApprovalRequestsSelected;

  const canDeselect = selectedApprovalRequestCount > 0;

  const handleApproveRequests = async (
    requestIds: string[],
    durationHours: number,
  ) => {
    setApprovalDurationHours(String(durationHours));
    handleApprovalDurationBlur();
    await handleAccessRequestDecision(requestIds, "approve", durationHours);
  };

  return (
    <div data-testid="approvals-page" className="space-y-6">
      <div className="flex items-stretch gap-2">
        <IntegrationsSearchInput
          testId="approvals-search"
          value={approvalSearch}
          onChange={setApprovalSearch}
          placeholder={APPROVALS_PAGE_COPY.searchPlaceholder}
          ariaLabel={APPROVALS_PAGE_COPY.searchPlaceholder}
          className="min-w-0 flex-1"
        />
        <button
          type="button"
          className="rounded-md border border-[var(--oh-border)] px-3 text-xs text-tertiary-light hover:text-white disabled:opacity-50"
          disabled={!canSelectAll}
          onClick={() =>
            setSelectedStateForApprovalRequests(
              filteredAccessRequests.map((request) => request.id),
              true,
            )
          }
        >
          Select all matches
        </button>
        <button
          type="button"
          className="rounded-md border border-[var(--oh-border)] px-3 text-xs text-tertiary-light hover:text-white disabled:opacity-50"
          disabled={!canDeselect}
          onClick={() =>
            setSelectedStateForApprovalRequests(selectedApprovalRequestIds, false)
          }
        >
          Deselect matches
        </button>
        <ApprovalsMatchSelectionMenu
          isDisabled={!canSelectAll && !canDeselect}
          onSelectAll={() =>
            setSelectedStateForApprovalRequests(
              filteredAccessRequests.map((request) => request.id),
              true,
            )
          }
          onDeselect={() =>
            setSelectedStateForApprovalRequests(selectedApprovalRequestIds, false)
          }
        />
        <input
          className="sr-only"
          type="number"
          aria-label="Approval duration in hours"
          value={approvalDurationHours}
          onChange={(event) => setApprovalDurationHours(event.target.value)}
          onBlur={handleApprovalDurationBlur}
        />
        <button
          type="button"
          className="rounded-md border border-[var(--oh-border)] px-3 text-xs text-tertiary-light hover:text-white disabled:opacity-50"
          disabled={approvalFilter !== "pending" || selectedApprovalRequestCount === 0 || requestActionPending}
          onClick={() => void handleAccessRequestDecision(selectedApprovalRequestIds, "approve")}
        >
          Approve selected
        </button>
        <button
          type="button"
          className="rounded-md border border-[var(--oh-border)] px-3 text-xs text-tertiary-light hover:text-white disabled:opacity-50"
          disabled={approvalFilter !== "pending" || selectedApprovalRequestCount === 0 || requestActionPending}
          onClick={() => void handleAccessRequestDecision(selectedApprovalRequestIds, "deny")}
        >
          Deny selected
        </button>
        <p className="sr-only">
          If you want to approve for more than 100 hours, change the setting to case-by-case on the integrations page.
        </p>


      </div>

      <ApprovalsPanel
        approvalFilter={approvalFilter}
        approvalCounts={approvalCounts}
        approvalDurationHours={approvalDurationHours}
        filteredAccessRequests={filteredAccessRequests}
        requestActionPending={requestActionPending}
        selectedApprovalRequestCount={selectedApprovalRequestCount}
        selectedApprovalRequests={selectedApprovalRequests}
        onApprovalFilterChange={setApprovalFilter}
        onApproveRequests={handleApproveRequests}
        onDenyRequests={(requestIds) => handleAccessRequestDecision(requestIds, "deny")}
        onToggleSelected={handleToggleSelected}
      />
    </div>
  );
};
