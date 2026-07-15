import { ArrowRight, Check, X } from "lucide-react";
import { Fragment, type MouseEvent } from "react";

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

const mobileFullWidthCellClassName =
  "col-span-full max-w-none p-0 md:max-w-0 md:px-2 md:py-2.5";

function ApprovalMobileFieldLabel({ children }: { children: string }) {
  return (
    <span className="mb-1 block text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--oh-muted)] md:hidden">
      {children}
    </span>
  );
}

function approvalToolColumnClassName(
  showSelectionColumn: boolean,
  showActionsColumn: boolean,
): string {
  const hasMobileControls = showSelectionColumn || showActionsColumn;

  return cn(
    tableCellClassName,
    "max-w-none break-words p-0 md:max-w-0 md:px-2 md:py-2.5",
    hasMobileControls
      ? "col-span-full row-start-2"
      : "col-start-1 row-start-1",
    showSelectionColumn ? undefined : "pl-4 pr-2",
  );
}

function ApprovalToolLabel({
  integrationKey,
  toolName,
}: {
  integrationKey: string;
  toolName: string;
}) {
  const segments = toolName.split("_");

  return (
    <>
      {integrationKey}.<wbr />
      {segments.map((segment, index) => (
        <Fragment key={`${segment}-${index}`}>
          {segment}
          {index < segments.length - 1 ? (
            <>
              _<wbr />
            </>
          ) : null}
        </Fragment>
      ))}
    </>
  );
}

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
        "grid items-start gap-x-3 gap-y-3 px-4 py-4 align-middle md:table-row md:px-0 md:py-0",
        showSelectionColumn && showActionsColumn
          ? "grid-cols-[auto_minmax(0,1fr)_auto]"
          : showSelectionColumn
            ? "grid-cols-[auto_minmax(0,1fr)]"
            : showActionsColumn
              ? "grid-cols-[minmax(0,1fr)_auto]"
              : "grid-cols-[minmax(0,1fr)]",
        formControlTransitionClassName,
        isRowSelectable && settingsListRowHoverClassName,
        isRowSelectable && "cursor-pointer",
        isRowSelectable && isSelected && "bg-[var(--oh-interactive-selected)]",
      )}
    >
      {showSelectionColumn ? (
        <td
          className={cn(
            tableCellClassName,
            "col-start-1 row-start-1 w-auto max-w-none p-0 align-middle md:w-12 md:pl-4 md:pr-2 md:py-2.5",
          )}
        >
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
        className={approvalToolColumnClassName(
          showSelectionColumn,
          showActionsColumn,
        )}
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            data-testid={`approval-request-logo-${request.id}`}
            className="shrink-0"
          >
            <IntegrationLogoBadge
              slug={request.integrationKey}
              name={request.integrationKey}
              className="h-7 w-7 rounded-md [&>svg]:max-h-3.5 [&>svg]:max-w-3.5 [&>img]:max-h-3.5 [&>img]:max-w-3.5"
            />
          </span>
          <div className="min-w-0 flex-1">
            <p
              aria-label={`${request.integrationKey}.${request.toolName}`}
              title={`${request.integrationKey}.${request.toolName}`}
              className="text-sm font-semibold text-white"
            >
              <span aria-hidden className="md:hidden">
                <span className="block text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--oh-muted)]">
                  {request.integrationKey}
                </span>
                <span className="mt-0.5 block">
                  {request.toolName.replaceAll("_", " ")}
                </span>
              </span>
              <span aria-hidden className="hidden md:inline">
                <ApprovalToolLabel
                  integrationKey={request.integrationKey}
                  toolName={request.toolName}
                />
              </span>
            </p>
            {request.justification ? (
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--oh-text-secondary)]">
                {request.justification}
              </p>
            ) : null}
          </div>
        </div>
      </td>

      <td className={cn(tableCellClassName, mobileFullWidthCellClassName, "break-words")}>
        <ApprovalMobileFieldLabel>
          {APPROVALS_PAGE_COPY.tableColumnInvocationIdentity}
        </ApprovalMobileFieldLabel>
        <p className="text-white">
          <span className="hidden md:inline">Invocation identity: </span>
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
        <td className={cn(tableCellClassName, mobileFullWidthCellClassName, "break-words")}>
          <ApprovalMobileFieldLabel>
            {APPROVALS_PAGE_COPY.tableColumnConversation}
          </ApprovalMobileFieldLabel>
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

      <td
        className={cn(
          tableCellClassName,
          mobileFullWidthCellClassName,
          "w-auto md:w-[108px] md:max-w-none",
        )}
      >
        <ApprovalMobileFieldLabel>
          {APPROVALS_PAGE_COPY.tableColumnRequested}
        </ApprovalMobileFieldLabel>
        <ApprovalTimestamp value={request.createdAt} />
      </td>

      <td
        className={cn(
          tableCellClassName,
          mobileFullWidthCellClassName,
          "w-auto whitespace-nowrap text-white md:w-20 md:max-w-none",
        )}
      >
        <ApprovalMobileFieldLabel>
          {APPROVALS_PAGE_COPY.tableColumnRequestedDuration}
        </ApprovalMobileFieldLabel>
        {formatRequestedDurationHours(request.requestedMinutes)}
      </td>

      {showDecisionColumns ? (
        <>
          <td
            className={cn(
              tableCellClassName,
              mobileFullWidthCellClassName,
              "break-words text-white",
            )}
          >
            <ApprovalMobileFieldLabel>
              {APPROVALS_PAGE_COPY.tableColumnDecidedBy}
            </ApprovalMobileFieldLabel>
            {request.decidedBy ?? "—"}
          </td>
          <td
            className={cn(
              tableCellClassName,
              mobileFullWidthCellClassName,
              "w-auto md:w-[108px] md:max-w-none",
            )}
          >
            <ApprovalMobileFieldLabel>
              {APPROVALS_PAGE_COPY.tableColumnDecidedAt}
            </ApprovalMobileFieldLabel>
            <ApprovalTimestamp value={request.decidedAt} />
          </td>
        </>
      ) : null}

      <td
        className={cn(
          tableCellClassName,
          mobileFullWidthCellClassName,
          "break-words text-white md:max-w-none",
        )}
      >
        <ApprovalMobileFieldLabel>
          {APPROVALS_PAGE_COPY.tableColumnScopes}
        </ApprovalMobileFieldLabel>
        {request.scopes.length > 0
          ? request.scopes.join(", ")
          : APPROVALS_PAGE_COPY.tableDefaultScopes}
      </td>

      {showActionsColumn ? (
        <td
          className={cn(
            tableCellClassName,
            "row-start-1 w-auto max-w-none p-0 align-middle md:w-[72px] md:px-2 md:py-2.5",
            showSelectionColumn ? "col-start-3" : "col-start-2",
          )}
        >
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
