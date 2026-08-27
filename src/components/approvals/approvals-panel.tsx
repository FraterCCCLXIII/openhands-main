"use client";

import React from "react";

import { ApprovalsDecisionMenu } from "@/src/components/approvals/approvals-decision-menu";
import { ApprovalsList } from "@/src/components/approvals/approvals-list";
import { ApproveSelectedModal } from "@/src/components/approvals/approve-selected-modal";
import { SettingsTabList } from "@/src/components/ui/settings-tab-list";
import {
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
  approvalDurationHours: string;
  canDecide?: boolean;
  filteredAccessRequests: AccessRequest[];
  requestActionPending: boolean;
  selectedApprovalRequestCount: number;
  selectedApprovalRequests: Record<string, boolean>;
  onApprovalFilterChange: (filter: ApprovalStatusFilter) => void;
  onApproveRequests: (requestIds: string[], durationHours: number) => Promise<void>;
  onDenyRequests: (requestIds: string[]) => Promise<void>;
  onToggleSelected: (requestId: string, selected: boolean) => void;
}

export function ApprovalsPanel({
  approvalFilter,
  approvalCounts,
  approvalDurationHours,
  canDecide = true,
  filteredAccessRequests,
  requestActionPending,
  selectedApprovalRequestCount,
  selectedApprovalRequests,
  onApprovalFilterChange,
  onApproveRequests,
  onDenyRequests,
  onToggleSelected,
}: ApprovalsPanelProps) {
  const [isApproveModalOpen, setIsApproveModalOpen] = React.useState(false);
  const [approveModalRequestIds, setApproveModalRequestIds] = React.useState<
    string[]
  >([]);

  const hasSelection = selectedApprovalRequestCount > 0;
  const canUseBulkActions =
    canDecide && approvalFilter === "pending" && hasSelection;

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
          className="min-w-0 flex-1"
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
          <div className="shrink-0 pb-2">
            <ApprovalsDecisionMenu
              isDisabled={!canUseBulkActions || requestActionPending}
              onApprove={() => openApproveModal(selectedIds)}
              onDeny={() => void onDenyRequests(selectedIds)}
            />
          </div>
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
          initialDurationHours={approvalDurationHours}
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
