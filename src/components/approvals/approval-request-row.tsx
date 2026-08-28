import { Check, ExternalLink, X } from "lucide-react";
import type { MouseEvent } from "react";

import {
  formatApprovalIdentityValue,
  formatConversationLinkLabel,
  formatTimestampParts,
  hasMissingApprovalIdentity,
} from "@/src/components/dashboard/utils";
import { IntegrationLogoBadge } from "@/src/components/integrations/integration-logo-badge";
import { Checkbox } from "@/src/components/ui/checkbox";
import { APPROVALS_PAGE_COPY } from "@/src/constants/approvals-page";
import { cn } from "@/src/lib/utils";
import { formControlTransitionClassName } from "@/src/styles/form-control-classes";
import { settingsListRowHoverClassName } from "@/src/styles/settings-list-classes";
import type { AccessRequest } from "@/src/types/integrations-hub";

const approvalRowIconActionClassName = cn(
  "inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full",
  formControlTransitionClassName,
);

const tableCellClassName =
  "max-w-0 overflow-hidden px-2 py-2 align-middle text-xs text-[var(--oh-text-secondary)]";

function approvalToolColumnClassName(showSelectionColumn: boolean): string {
  return cn(
    tableCellClassName,
    showSelectionColumn ? undefined : "pl-4 pr-2",
  );
}

function ApprovalTimestamp({ value }: { value?: string }) {
  const parts = formatTimestampParts(value);

  if (!parts) {
    return <span className="text-white">—</span>;
  }

  return (
    <div className="flex flex-col whitespace-nowrap text-white">
      <span>{parts.date}</span>
      <span className="text-[var(--oh-text-secondary)]">{parts.time}</span>
    </div>
  );
}

interface ApprovalRequestRowProps {
  request: AccessRequest;
  isSelected: boolean;
  showSelectionColumn: boolean;
  showDecisionColumns: boolean;
  showActionsColumn: boolean;
  showConversationColumn: boolean;
  requestActionPending: boolean;
  onToggleSelected: (requestId: string, selected: boolean) => void;
  onApprove?: (requestId: string) => void;
  onDeny?: (requestId: string) => void;
}

function formatRequestedDurationHours(requestedMinutes: number): string {
  return `${Math.max(1, Math.round(requestedMinutes / 60))}h`;
}

const isRowSelectionTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return !target.closest("button, a, input, label");
};

export function ApprovalRequestRow({
  request,
  isSelected,
  showSelectionColumn,
  showDecisionColumns,
  showActionsColumn,
  showConversationColumn,
  requestActionPending,
  onToggleSelected,
  onApprove,
  onDeny,
}: ApprovalRequestRowProps) {
  const toolLabel = `${request.integrationKey}.${request.toolName}`;
  const identityLabel = `${formatApprovalIdentityValue(request.agentId)} · ${formatApprovalIdentityValue(request.agentClass)}`;
  const scopesLabel =
    request.scopes.length > 0
      ? request.scopes.join(", ")
      : APPROVALS_PAGE_COPY.tableDefaultScopes;
  const isRowSelectable =
    showSelectionColumn && request.status === "pending" && !requestActionPending;

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>) => {
    if (!isRowSelectable || !isRowSelectionTarget(event.target)) {
      return;
    }

    onToggleSelected(request.id, !isSelected);
  };

  return (
    <tr
      data-request-id={request.id}
      data-testid={`approval-request-row-${request.id}`}
      onClick={handleRowClick}
      className={cn(
        "align-middle",
        formControlTransitionClassName,
        isRowSelectable && settingsListRowHoverClassName,
        isRowSelectable && "cursor-pointer",
        isRowSelectable && isSelected && "bg-[var(--oh-interactive-selected)]",
      )}
    >
      {showSelectionColumn ? (
        <td className={cn(tableCellClassName, "w-10 max-w-none align-middle pl-4 pr-2")}>
          {request.status === "pending" ? (
            <Checkbox
              aria-label={`Select request ${request.id}`}
              checked={isSelected}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) =>
                onToggleSelected(request.id, event.currentTarget.checked)
              }
              disabled={requestActionPending}
            />
          ) : (
            <span aria-hidden className="inline-block size-4 shrink-0" />
          )}
        </td>
      ) : null}

      <td
        data-testid={`approval-request-tool-${request.id}`}
        className={approvalToolColumnClassName(showSelectionColumn)}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            data-testid={`approval-request-logo-${request.id}`}
            className="shrink-0"
          >
            <IntegrationLogoBadge
              slug={request.integrationKey}
              name={request.integrationKey}
              className="h-5 w-5 rounded p-1 [&>svg]:max-h-3 [&>svg]:max-w-3 [&>img]:max-h-3 [&>img]:max-w-3"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-white" title={toolLabel}>
              {toolLabel}
            </p>
            {request.justification ? (
              <p
                className="mt-0.5 truncate text-[var(--oh-text-secondary)]"
                title={request.justification}
              >
                {request.justification}
              </p>
            ) : null}
          </div>
        </div>
      </td>

      <td className={tableCellClassName}>
        <p className="truncate text-white" title={identityLabel}>
          {formatApprovalIdentityValue(request.agentId)}
          <span className="text-[var(--oh-muted)]"> · </span>
          {formatApprovalIdentityValue(request.agentClass)}
        </p>
        {hasMissingApprovalIdentity(request) ? (
          <p className="mt-0.5 truncate text-[var(--oh-muted)]">
            {APPROVALS_PAGE_COPY.tableMissingIdentityHint}
          </p>
        ) : null}
      </td>

      {showConversationColumn ? (
        <td className={tableCellClassName}>
          {request.agentData?.conversationLink ? (
            <a
              href={request.agentData.conversationLink}
              target="_blank"
              rel="noreferrer"
              title={request.agentData.conversationLink}
              aria-label={APPROVALS_PAGE_COPY.tableConversationOpenAriaLabel(
                request.agentData.conversationLink,
              )}
              className="flex min-w-0 items-center gap-1 text-[var(--oh-accent)] hover:text-[var(--oh-accent-hover)]"
            >
              <span className="truncate">
                {formatConversationLinkLabel(request.agentData.conversationLink)}
              </span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </a>
          ) : (
            <span className="text-white">—</span>
          )}
        </td>
      ) : null}

      <td className={cn(tableCellClassName, "w-[5.75rem] max-w-none")}>
        <ApprovalTimestamp value={request.createdAt} />
      </td>

      <td className={cn(tableCellClassName, "w-14 max-w-none text-white")}>
        {formatRequestedDurationHours(request.requestedMinutes)}
      </td>

      {showDecisionColumns ? (
        <>
          <td className={cn(tableCellClassName, "text-white")}>
            <p className="truncate" title={request.decidedBy ?? undefined}>
              {request.decidedBy ?? "—"}
            </p>
          </td>
          <td className={cn(tableCellClassName, "w-[5.75rem] max-w-none")}>
            <ApprovalTimestamp value={request.decidedAt} />
          </td>
        </>
      ) : null}

      <td className={cn(tableCellClassName, "text-white")}>
        <p className="truncate" title={scopesLabel}>
          {scopesLabel}
        </p>
      </td>

      {showActionsColumn ? (
        <td className={cn(tableCellClassName, "w-16 max-w-none align-middle pr-3")}>
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              data-testid={`approval-request-approve-${request.id}`}
              aria-label={APPROVALS_PAGE_COPY.approveRequestAriaLabel(
                request.toolName,
                request.integrationKey,
              )}
              disabled={requestActionPending}
              onClick={(event) => {
                event.stopPropagation();
                onApprove?.(request.id);
              }}
              className={cn(
                approvalRowIconActionClassName,
                "text-[var(--oh-success)] hover:bg-[color:rgba(165,231,94,0.12)] hover:text-[var(--oh-success)] disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <Check className="size-3.5" aria-hidden strokeWidth={2} />
            </button>
            <button
              type="button"
              data-testid={`approval-request-deny-${request.id}`}
              aria-label={APPROVALS_PAGE_COPY.denyRequestAriaLabel(
                request.toolName,
                request.integrationKey,
              )}
              disabled={requestActionPending}
              onClick={(event) => {
                event.stopPropagation();
                onDeny?.(request.id);
              }}
              className={cn(
                approvalRowIconActionClassName,
                "text-[var(--oh-danger)] hover:bg-[color:rgba(231,106,94,0.12)] hover:text-[var(--oh-danger)] disabled:cursor-not-allowed disabled:opacity-60",
              )}
            >
              <X className="size-3.5" aria-hidden strokeWidth={2} />
            </button>
          </div>
        </td>
      ) : null}
    </tr>
  );
}
