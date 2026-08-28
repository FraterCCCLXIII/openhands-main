"use client";

import React from "react";

import { ApprovalsDecisionMenu } from "@/src/components/approvals/approvals-decision-menu";
import { ApprovalsList } from "@/src/components/approvals/approvals-list";
import { ApproveSelectedModal } from "@/src/components/approvals/approve-selected-modal";
import { SettingsTabList } from "@/src/components/ui/settings-tab-list";
import {
  APPROVAL_DURATION,
  APPROVALS_PAGE_COPY,
  type ApprovalStatusFilter,
} from "@/src/constants/approvals-page";
import { hubSearchEmptyStateClassName } from "@/src/styles/extension-module-card-classes";
import type { AccessRequest } from "@/src/types/integrations-hub";

interface ApprovalCounts {
  pending: number;
  approved: number;
  denied: number;
}

interface ApprovalsPanelProps {
  approvalFilter: ApprovalStatusFilter;
  approvalCounts: ApprovalCounts;
  canDecide?: boolean;
  filteredAccessRequests: AccessRequest[];
  requestActionPending: boolean;
  selectedApprovalRequestCount: number;
  selectedApprovalRequests: Record<string, boolean>;
  onApprovalFilterChange: (filter: ApprovalStatusFilter) => void;
  onApproveRequests: (requestIds: string[], durationHours: number) => Promise<void>;
  onDenyRequests: (requestIds: string[]) => Promise<void>;
  onSelectAllMatches: () => void;
  onDeselectMatches: () => void;
  onToggleSelected: (requestId: string, selected: boolean) => void;
  canSelectAll: boolean;
  canDeselect: boolean;
  canApprove: boolean;
  canDeny: boolean;
}

export function ApprovalsPanel({
  approvalFilter,
  approvalCounts,
  canDecide = true,
  filteredAccessRequests,
  requestActionPending,
  selectedApprovalRequestCount,
  selectedApprovalRequests,
  onApprovalFilterChange,
  onApproveRequests,
  onDenyRequests,
  onSelectAllMatches,
  onDeselectMatches,
  onToggleSelected,
  canSelectAll,
  canDeselect,
  canApprove,
  canDeny,
}: ApprovalsPanelProps) {
  const [isApproveModalOpen, setIsApproveModalOpen] = React.useState(false);
  const [approveModalRequestIds, setApproveModalRequestIds] = React.useState<
    string[]
  >([]);

  const canUseBulkActions =
    canDecide && (canSelectAll || canDeselect || canApprove || canDeny);

  const openApproveModal = (requestIds: string[]) => {
    setApproveModalRequestIds(requestIds);
    setIsApproveModalOpen(true);
  };

  const closeApproveModal = () => {
    setIsApproveModalOpen(false);
    setApproveModalRequestIds([]);
  };

  const selectedIds = filteredAccessRequests
    .filter((request) => selectedApprovalRequests[request.id])
    .map((request) => request.id);

  return (
    <div data-testid="approvals-panel" className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <SettingsTabList
          testId="approvals-filter"
          ariaLabel="Filter approvals by status"
          value={approvalFilter}
          onChange={onApprovalFilterChange}
          className="min-w-0 flex-1 self-end"
          options={[
            {
              value: "pending",
              label: APPROVALS_PAGE_COPY.filterPending,
              count: approvalCounts.pending,
            },
            {
              value: "approved",
              label: APPROVALS_PAGE_COPY.filterApproved,
              count: approvalCounts.approved,
            },
            {
              value: "denied",
              label: APPROVALS_PAGE_COPY.filterDenied,
              count: approvalCounts.denied,
            },
          ]}
        />
        {canDecide ? (
          <ApprovalsDecisionMenu
            isDisabled={!canUseBulkActions}
            canSelectAll={canSelectAll}
            canDeselect={canDeselect}
            canApprove={canApprove}
            canDeny={canDeny}
            onSelectAll={onSelectAllMatches}
            onDeselect={onDeselectMatches}
            onApprove={() => openApproveModal(selectedIds)}
            onDeny={() => void onDenyRequests(selectedIds)}
          />
        ) : null}
      </div>

      {filteredAccessRequests.length > 0 ? (
        <ApprovalsList
          requests={filteredAccessRequests}
          approvalFilter={approvalFilter}
          selectedRequests={selectedApprovalRequests}
          showSelection={canDecide}
          showRowActions={canDecide && approvalFilter === "pending"}
          requestActionPending={requestActionPending}
          onToggleSelected={onToggleSelected}
          onApproveRequest={(requestId) => openApproveModal([requestId])}
          onDenyRequest={(requestId) => void onDenyRequests([requestId])}
        />
      ) : (
        <div
          data-testid="approvals-empty-state"
          className={hubSearchEmptyStateClassName}
        >
          <p className="text-xs text-tertiary-light">
            {APPROVALS_PAGE_COPY.emptyState(approvalFilter)}
          </p>
        </div>
      )}

      {canDecide && isApproveModalOpen ? (
        <ApproveSelectedModal
          selectedCount={approveModalRequestIds.length}
          initialDurationHours={String(APPROVAL_DURATION.defaultHours)}
          onClose={closeApproveModal}
          onConfirm={async (durationHours) => {
            await onApproveRequests(approveModalRequestIds, durationHours);
            closeApproveModal();
          }}
        />
      ) : null}
    </div>
  );
}
