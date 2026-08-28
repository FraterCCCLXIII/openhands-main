import { MessageSquare } from "lucide-react";

import { IntegrationLogoBadge } from "@/src/components/integrations/integration-logo-badge";
import { HoverCard } from "@/src/components/ui/hover-card";
import { formatTimestampParts } from "@/src/components/dashboard/utils";
import { HUB_PAGE_COPY } from "@/src/constants/hub-pages";
import { cn } from "@/src/lib/utils";
import {
  settingsListIconActionButtonClassName,
  settingsListTableCellClassName,
} from "@/src/styles/settings-list-classes";
import { formControlTransitionClassName } from "@/src/styles/form-control-classes";
import type { IntegrationRequest } from "@/src/types/integrations-hub";

const copy = HUB_PAGE_COPY.adminUserRequests;

const tableCellClassName = cn(
  settingsListTableCellClassName,
  "max-w-0 px-3 py-3 align-middle text-xs text-[var(--oh-text-secondary)]",
);

interface UserRequestRowProps {
  request: IntegrationRequest;
  actionPending: boolean;
  onAdd: (request: IntegrationRequest) => void;
  onDismiss: (requestId: string) => void;
}

function RequestTimestamp({ value }: { value?: string }) {
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

export function UserRequestRow({
  request,
  actionPending,
  onAdd,
  onDismiss,
}: UserRequestRowProps) {
  const notes = request.notes?.trim() ?? "";
  const sourceLabel =
    request.source === "catalog" ? copy.sourceCatalog : copy.sourceCustom;

  return (
    <tr
      data-testid={`user-request-row-${request.id}`}
      className="align-middle"
    >
      <td className={cn(tableCellClassName, "pl-4")}>
        <div className="flex min-w-0 items-start gap-2.5">
          <IntegrationLogoBadge
            slug={request.slug ?? request.name}
            name={request.name}
            className="h-7 w-7 rounded-md [&>svg]:max-h-3.5 [&>svg]:max-w-3.5 [&>img]:max-h-3.5 [&>img]:max-w-3.5"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{request.name}</p>
            <p className="mt-0.5 text-xs text-[var(--oh-muted)]">{sourceLabel}</p>
          </div>
        </div>
      </td>
      <td className={cn(tableCellClassName, "break-words text-white")}>
        {request.requestedBy || "—"}
      </td>
      <td className={cn(tableCellClassName, "w-[108px] max-w-none")}>
        <RequestTimestamp value={request.createdAt} />
      </td>
      <td className={cn(tableCellClassName, "w-16 max-w-none")}>
        {notes ? (
          <HoverCard
            testId={`user-request-notes-${request.id}`}
            content={notes}
          >
            <button
              type="button"
              aria-label={copy.notesAriaLabel}
              className={cn(
                settingsListIconActionButtonClassName,
                "text-[var(--oh-text-secondary)]",
              )}
            >
              <MessageSquare className="size-4" aria-hidden strokeWidth={2} />
            </button>
          </HoverCard>
        ) : (
          <span className="text-white">—</span>
        )}
      </td>
      <td className={cn(tableCellClassName, "w-[148px] max-w-none pr-4")}>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            data-testid={`user-request-add-${request.id}`}
            aria-label={copy.addAriaLabel(request.name)}
            disabled={actionPending}
            onClick={() => onAdd(request)}
            className={cn(
              "inline-flex h-7 cursor-pointer items-center rounded-md px-2 text-xs font-medium text-[var(--oh-success)]",
              formControlTransitionClassName,
              "hover:bg-[color:rgba(165,231,94,0.12)] disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {copy.addLabel}
          </button>
          <button
            type="button"
            data-testid={`user-request-dismiss-${request.id}`}
            aria-label={copy.dismissAriaLabel(request.name)}
            disabled={actionPending}
            onClick={() => onDismiss(request.id)}
            className={cn(
              "inline-flex h-7 cursor-pointer items-center rounded-md px-2 text-xs font-medium text-[var(--oh-danger)]",
              formControlTransitionClassName,
              "hover:bg-[color:rgba(231,106,94,0.12)] disabled:cursor-not-allowed disabled:opacity-60",
            )}
          >
            {copy.dismissLabel}
          </button>
        </div>
      </td>
    </tr>
  );
}
