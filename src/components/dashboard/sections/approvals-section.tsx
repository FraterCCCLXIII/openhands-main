"use client";

import { ApprovalsMatchSelectionMenu } from "@/src/components/approvals/approvals-match-selection-menu";
import { ApprovalsPanel } from "@/src/components/approvals/approvals-panel";
import { IntegrationsSearchInput } from "@/src/components/integrations/integrations-search-input";
import {
  APPROVAL_DURATION,
  APPROVALS_PAGE_COPY,
} from "@/src/constants/approvals-page";
import type { ApprovalRequestFilter } from "@/src/components/dashboard/utils";
import type { AccessRequest } from "@/src/types/integrations-hub";
import { normalizeApprovalDurationHours } from "@/src/lib/access-requests";
import { cn } from "@/src/lib/utils";
import { formControlFieldClassName } from "@/src/styles/form-control-classes";

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

  const currentDurationHours = () => {
    const parsed = Number(approvalDurationHours);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return APPROVAL_DURATION.defaultHours;
    }
    return normalizeApprovalDurationHours(parsed);
  };

  const canApprove =
    approvalFilter === "pending" &&
    selectedApprovalRequestCount > 0 &&
    !requestActionPending;

  return (
    <div data-testid="approvals-page" className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
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
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            min={APPROVAL_DURATION.minHours}
            max={APPROVAL_DURATION.maxHours}
            step={1}
            value={approvalDurationHours}
            aria-label={APPROVALS_PAGE_COPY.durationAriaLabel}
            data-testid="approvals-duration-hours"
            disabled={approvalFilter !== "pending"}
            onChange={(event) => setApprovalDurationHours(event.target.value)}
            onBlur={handleApprovalDurationBlur}
            className={cn(
              formControlFieldClassName,
              "h-9 w-20 px-2 py-1 text-xs tabular-nums",
            )}
          />
          <span className="shrink-0 text-xs text-tertiary-light">
            {APPROVALS_PAGE_COPY.hoursLabel}
          </span>
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-[var(--oh-border)] px-3 text-xs text-tertiary-light hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canApprove}
          onClick={() =>
            void handleApproveRequests(
              selectedApprovalRequestIds,
              currentDurationHours(),
            )
          }
        >
          Approve selected
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-[var(--oh-border)] px-3 text-xs text-tertiary-light hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          disabled={
            approvalFilter !== "pending" ||
            selectedApprovalRequestCount === 0 ||
            requestActionPending
          }
          onClick={() => void handleAccessRequestDecision(selectedApprovalRequestIds, "deny")}
        >
          Deny selected
        </button>
      </div>

      <p className="text-xs text-[var(--oh-muted)]">
        {APPROVALS_PAGE_COPY.decideSelectedDescription(
          APPROVAL_DURATION.defaultHours,
          APPROVAL_DURATION.maxHours,
        )}{" "}
        {APPROVALS_PAGE_COPY.longDurationHintPrefix}{" "}
        <a href="/integrations" className="text-white hover:opacity-80">
          {APPROVALS_PAGE_COPY.longDurationHintLink}
        </a>
        {APPROVALS_PAGE_COPY.longDurationHintSuffix}
      </p>

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
