import { ArrowRight, Check, X } from "lucide-react";
import type { MouseEvent } from "react";

import {
  formatApprovalIdentityValue,
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
  "inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full",
  formControlTransitionClassName,
);

const tableCellClassName =
  "max-w-0 px-2 py-2.5 align-middle text-xs text-[var(--oh-text-secondary)]";

function ApprovalTimestamp({ value }: { value?: string }) {
  const parts = formatTimestampParts(value);

  if (!parts) {
    return <span className="text-white">—</span>;
  }

  return (
    <div className="flex flex-col text-white">
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
        <td className={cn(tableCellClassName, "w-12 max-w-none align-middle pl-4 pr-2")}>
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
        data-testid={`approval-request-logo-${request.id}`}
        className={cn(
          tableCellClassName,
          "w-12 max-w-none align-middle",
          showSelectionColumn ? "px-2" : "pl-4 pr-2",
        )}
      >
        <IntegrationLogoBadge
          slug={request.integrationKey}
          name={request.integrationKey}
          className="h-7 w-7 rounded-md [&>svg]:max-h-3.5 [&>svg]:max-w-3.5 [&>img]:max-h-3.5 [&>img]:max-w-3.5"
        />
      </td>

      <td className={cn(tableCellClassName, "break-words")}>
        <p className="text-sm font-semibold text-white">{toolLabel}</p>
        {request.justification ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--oh-text-secondary)]">
            {request.justification}
          </p>
        ) : null}
      </td>

      <td className={cn(tableCellClassName, "break-words")}>
        <p className="text-white">
          {formatApprovalIdentityValue(request.agentId)}
          <span className="text-[var(--oh-muted)]"> · </span>
          {formatApprovalIdentityValue(request.agentClass)}
        </p>
        {hasMissingApprovalIdentity(request) ? (
          <p className="mt-1 text-[var(--oh-muted)]">
            {APPROVALS_PAGE_COPY.tableMissingIdentityHint}
          </p>
        ) : null}
      </td>

      {showConversationColumn ? (
        <td className={cn(tableCellClassName, "break-words")}>
          {request.agentData?.conversationLink ? (
            <a
              href={request.agentData.conversationLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 break-all text-[var(--oh-accent)] hover:text-[var(--oh-accent-hover)]"
            >
              <span>{request.agentData.conversationLink}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </a>
          ) : (
            <span className="text-white">—</span>
          )}
        </td>
      ) : null}

      <td className={cn(tableCellClassName, "w-[108px] max-w-none")}>
        <ApprovalTimestamp value={request.createdAt} />
      </td>

      <td
        className={cn(
          tableCellClassName,
          "w-20 max-w-none whitespace-nowrap text-white",
        )}
      >
        {formatRequestedDurationHours(request.requestedMinutes)}
      </td>

      {showDecisionColumns ? (
        <>
          <td className={cn(tableCellClassName, "break-words text-white")}>
            {request.decidedBy ?? "—"}
          </td>
          <td className={cn(tableCellClassName, "w-[108px] max-w-none")}>
            <ApprovalTimestamp value={request.decidedAt} />
          </td>
        </>
      ) : null}

      <td className={cn(tableCellClassName, "max-w-none break-words text-white")}>
        {request.scopes.length > 0
          ? request.scopes.join(", ")
          : APPROVALS_PAGE_COPY.tableDefaultScopes}
      </td>

      {showActionsColumn ? (
        <td className={cn(tableCellClassName, "w-[72px] max-w-none align-middle")}>
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
              <Check className="size-4" aria-hidden strokeWidth={2} />
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
              <X className="size-4" aria-hidden strokeWidth={2} />
            </button>
          </div>
        </td>
      ) : null}
    </tr>
  );
}
