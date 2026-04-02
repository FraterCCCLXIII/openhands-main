import { CheckCircle2 } from "lucide-react";

import {
  CompactPanel,
  dashboardInputClassName,
} from "@/src/components/admin/dashboard-workspace-shared";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import {
  approvalStatusTone,
  formatTimestamp,
  type ApprovalRequestFilter,
} from "@/src/components/admin/dashboard-workspace-utils";
import {
  DEFAULT_CASE_BY_CASE_APPROVAL_HOURS,
  MAX_CASE_BY_CASE_APPROVAL_HOURS,
  approvalStatusLabel,
} from "@/src/lib/access-requests";
import type { AccessRequest } from "@/src/types/context-layer";

interface DashboardApprovalsSectionProps {
  approvalCounts: Record<ApprovalRequestFilter, number>;
  approvalDurationHours: string;
  approvalFilter: ApprovalRequestFilter;
  approvalSearch: string;
  allVisibleApprovalRequestsSelected: boolean;
  filteredAccessRequests: AccessRequest[];
  handleAccessRequestDecision: (
    requestIds: string[],
    action: "approve" | "deny",
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

export const DashboardApprovalsSection = ({
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
}: DashboardApprovalsSectionProps) => (
  <section className="space-y-4">
    <CompactPanel
      title="Case-by-case approvals"
      icon={CheckCircle2}
      action={<Badge>{filteredAccessRequests.length} shown</Badge>}
    >
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-white">
              Review pending agent approval requests
            </h3>
            <p className="text-xs leading-6 text-[var(--color-text-base)]">
              Pending requests are auto-created when an agent attempts to call a
              case-by-case tool without an active temporary grant.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge tone="warning">{approvalCounts.pending} pending</Badge>
            <Badge tone="success">{approvalCounts.approved} approved</Badge>
            <Badge tone="danger">{approvalCounts.denied} denied</Badge>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {([
            ["pending", approvalCounts.pending],
            ["approved", approvalCounts.approved],
            ["denied", approvalCounts.denied],
          ] as const).map(([filter, count]) => (
            <Button
              key={filter}
              type="button"
              variant={approvalFilter === filter ? "secondary" : "ghost"}
              className="h-9 rounded-md px-3 text-xs capitalize"
              onClick={() => setApprovalFilter(filter)}
            >
              {filter} ({count})
            </Button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <input
            type="search"
            value={approvalSearch}
            onChange={(event) => setApprovalSearch(event.target.value)}
            placeholder="Search case-by-case approvals"
            aria-label="Search case-by-case approvals"
            className={cn(dashboardInputClassName, "w-full xl:max-w-md")}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-md px-3 text-xs"
              disabled={
                approvalFilter !== "pending" ||
                !hasVisibleApprovalRequests ||
                allVisibleApprovalRequestsSelected
              }
              onClick={() =>
                setSelectedStateForApprovalRequests(
                  filteredAccessRequests.map((request) => request.id),
                  true,
                )
              }
            >
              Select all matches
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-9 rounded-md px-3 text-xs"
              disabled={selectedApprovalRequestCount === 0}
              onClick={() =>
                setSelectedStateForApprovalRequests(
                  selectedApprovalRequestIds,
                  false,
                )
              }
            >
              Deselect matches
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                Decide selected requests
              </p>
              <p className="text-xs leading-6 text-[var(--color-text-base)]">
                Approvals default to {DEFAULT_CASE_BY_CASE_APPROVAL_HOURS} hours and
                can last up to {MAX_CASE_BY_CASE_APPROVAL_HOURS} hours.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-base)]">
              <Badge>{selectedApprovalRequestCount} selected</Badge>
              <label className="flex items-center gap-2">
                <span>Duration</span>
                <input
                  type="number"
                  min={1}
                  max={MAX_CASE_BY_CASE_APPROVAL_HOURS}
                  step={1}
                  value={approvalDurationHours}
                  onChange={(event) => setApprovalDurationHours(event.target.value)}
                  onBlur={handleApprovalDurationBlur}
                  aria-label="Approval duration in hours"
                  className={cn(
                    dashboardInputClassName,
                    "h-9 w-24 px-3 py-2 text-sm",
                  )}
                />
                <span>hours</span>
              </label>
            </div>
          </div>
          <p className="mt-3 text-xs leading-6 text-[var(--color-text-base)]">
            If you want to approve for more than 100 hours, change the setting to
            case-by-case on the <a href="/integrations" className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]">integrations page</a>.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              className="h-9 rounded-md px-3 text-xs"
              disabled={
                approvalFilter !== "pending" ||
                selectedApprovalRequestCount === 0 ||
                requestActionPending
              }
              onClick={() =>
                void handleAccessRequestDecision(selectedApprovalRequestIds, "approve")
              }
            >
              Approve selected
            </Button>
            <Button
              type="button"
              variant="danger"
              className="h-9 rounded-md px-3 text-xs"
              disabled={
                approvalFilter !== "pending" ||
                selectedApprovalRequestCount === 0 ||
                requestActionPending
              }
              onClick={() =>
                void handleAccessRequestDecision(selectedApprovalRequestIds, "deny")
              }
            >
              Deny selected
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredAccessRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]">
              No {approvalFilter} approval requests match the current search.
            </div>
          ) : (
            filteredAccessRequests.map((request) => (
              <div
                key={request.id}
                data-request-id={request.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex gap-3">
                    {request.status === "pending" ? (
                      <input
                        type="checkbox"
                        aria-label={`Select request ${request.id}`}
                        checked={Boolean(selectedApprovalRequests[request.id])}
                        onChange={(event) =>
                          setSelectedStateForApprovalRequests(
                            [request.id],
                            event.currentTarget.checked,
                          )
                        }
                        disabled={requestActionPending}
                        className="mt-1 h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-bg-input)]"
                      />
                    ) : (
                      <span className="mt-1 h-4 w-4 shrink-0 rounded border border-transparent" />
                    )}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">
                          {request.integrationKey}.{request.functionName}
                        </p>
                        <Badge tone={approvalStatusTone(request.status)}>
                          {approvalStatusLabel(request.status)}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-xs text-[var(--color-text-base)] sm:grid-cols-2 xl:grid-cols-3">
                        <p>
                          Agent: <span className="text-white">{request.agentId}</span>
                        </p>
                        <p>
                          Class: <span className="text-white">{request.agentClass}</span>
                        </p>
                        <p>
                          Requested: <span className="text-white">{formatTimestamp(request.createdAt)}</span>
                        </p>
                        <p>
                          Requested duration: <span className="text-white">{Math.max(1, Math.round(request.requestedMinutes / 60))}h</span>
                        </p>
                        <p>
                          Decided by: <span className="text-white">{request.decidedBy ?? "—"}</span>
                        </p>
                        <p>
                          Decided at: <span className="text-white">{formatTimestamp(request.decidedAt)}</span>
                        </p>
                      </div>
                      {request.justification ? (
                        <p className="text-xs leading-6 text-[var(--color-text-base)]">
                          {request.justification}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {request.scopes.length > 0 ? (
                          request.scopes.map((scope) => (
                            <Badge key={`${request.id}-${scope}`}>{scope}</Badge>
                          ))
                        ) : (
                          <Badge>default scopes</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {request.status === "pending" ? (
                    <div className="flex shrink-0 flex-col gap-2 xl:min-w-[170px]">
                      <Button
                        type="button"
                        className="h-9 rounded-md px-3 text-xs"
                        disabled={requestActionPending}
                        onClick={() =>
                          void handleAccessRequestDecision([request.id], "approve")
                        }
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        className="h-9 rounded-md px-3 text-xs"
                        disabled={requestActionPending}
                        onClick={() =>
                          void handleAccessRequestDecision([request.id], "deny")
                        }
                      >
                        Deny
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </CompactPanel>
  </section>
);
