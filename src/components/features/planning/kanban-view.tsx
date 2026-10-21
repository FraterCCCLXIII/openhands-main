import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { NavigationLink } from "#/components/shared/navigation-link";
import {
  ASSIGNEE_LABEL_KEYS,
  PRIORITY_LABEL_KEYS,
  STATUS_LABEL_KEYS,
  TICKET_STATUSES,
} from "#/planning/constants";
import type { Ticket, TicketStatus } from "#/planning/types";
import { usePlanningStore } from "#/stores/planning-store";
import { cn } from "#/utils/utils";

interface KanbanViewProps {
  selectedTicketId: string | null;
  onSelectTicket: (id: string) => void;
}

interface TicketCardProps {
  ticket: Ticket;
  selected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
}

function TicketCard({
  ticket,
  selected,
  onSelect,
  onDragStart,
}: TicketCardProps) {
  const { t } = useTranslation("openhands");
  const moveTicket = usePlanningStore((state) => state.moveTicket);
  const statusIndex = TICKET_STATUSES.indexOf(ticket.status);
  const previous = TICKET_STATUSES[statusIndex - 1];
  const next = TICKET_STATUSES[statusIndex + 1];
  const assignee =
    ticket.assignee === "agent" && ticket.agentLabel
      ? ticket.agentLabel
      : t(ASSIGNEE_LABEL_KEYS[ticket.assignee]);

  return (
    <li
      draggable
      data-testid={`ticket-card-${ticket.id}`}
      onDragStart={() => onDragStart(ticket.id)}
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-surface-raised p-3",
        selected ? "border-primary" : "border-border",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(ticket.id)}
        className="text-left text-sm font-medium text-content"
      >
        {ticket.title}
      </button>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>{assignee}</span>
        <span>{t(PRIORITY_LABEL_KEYS[ticket.priority])}</span>
        <span>{t(I18nKey.PLANNING$POINTS, { count: ticket.estimate })}</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <button
            type="button"
            disabled={!previous}
            aria-label={t(I18nKey.PLANNING$MOVE_PREVIOUS, {
              title: ticket.title,
            })}
            onClick={() => previous && moveTicket(ticket.id, previous)}
            className="rounded p-1 text-muted hover:bg-interactive-hover disabled:opacity-30"
          >
            <ChevronLeft size={14} aria-hidden />
          </button>
          <button
            type="button"
            disabled={!next}
            aria-label={t(I18nKey.PLANNING$MOVE_NEXT, { title: ticket.title })}
            onClick={() => next && moveTicket(ticket.id, next)}
            className="rounded p-1 text-muted hover:bg-interactive-hover disabled:opacity-30"
          >
            <ChevronRight size={14} aria-hidden />
          </button>
        </div>
        {ticket.linkedConversationId && (
          <NavigationLink
            to={`/conversations/${ticket.linkedConversationId}`}
            aria-label={t(I18nKey.PLANNING$LINKED_CONVERSATION)}
            className="rounded p-1 text-muted hover:bg-interactive-hover"
          >
            <ExternalLink size={14} aria-hidden />
          </NavigationLink>
        )}
      </div>
    </li>
  );
}

export function KanbanView({
  selectedTicketId,
  onSelectTicket,
}: KanbanViewProps) {
  const { t } = useTranslation("openhands");
  const tickets = usePlanningStore((state) => state.tickets);
  const moveTicket = usePlanningStore((state) => state.moveTicket);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleDrop = (status: TicketStatus) => {
    if (draggingId) {
      moveTicket(draggingId, status);
    }
    setDraggingId(null);
  };

  return (
    <div className="flex min-w-max gap-3">
      {TICKET_STATUSES.map((status) => {
        const columnTickets = tickets.filter(
          (ticket) => ticket.status === status,
        );
        return (
          <section
            key={status}
            data-testid={`column-${status}`}
            aria-label={t(STATUS_LABEL_KEYS[status])}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(status)}
            className="flex w-64 flex-col gap-2 rounded-lg bg-surface p-2"
          >
            <h3 className="flex justify-between px-1 text-xs font-semibold uppercase text-muted">
              <span>{t(STATUS_LABEL_KEYS[status])}</span>
              <span>{columnTickets.length}</span>
            </h3>
            {columnTickets.length === 0 ? (
              <p className="px-1 text-xs text-muted">
                {t(I18nKey.PLANNING$EMPTY_COLUMN)}
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {columnTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.id}
                    ticket={ticket}
                    selected={ticket.id === selectedTicketId}
                    onSelect={onSelectTicket}
                    onDragStart={setDraggingId}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
