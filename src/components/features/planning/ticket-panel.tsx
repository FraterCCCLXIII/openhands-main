import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import {
  ASSIGNEE_LABEL_KEYS,
  PRIORITY_LABEL_KEYS,
  STATUS_LABEL_KEYS,
  TICKET_ASSIGNEES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "#/planning/constants";
import type {
  TicketAssignee,
  TicketPriority,
  TicketStatus,
} from "#/planning/types";
import { usePlanningStore } from "#/stores/planning-store";

interface TicketPanelProps {
  ticketId: string;
  onClose: () => void;
}

const FIELD_CLASS =
  "rounded border border-border bg-surface px-2 py-1 text-sm text-content";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted">
      {label}
      {children}
    </label>
  );
}

function parseLabels(value: string): string[] {
  return value
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);
}

export function TicketPanel({ ticketId, onClose }: TicketPanelProps) {
  const { t } = useTranslation("openhands");
  const ticket = usePlanningStore((state) =>
    state.tickets.find((tk) => tk.id === ticketId),
  );
  const sprints = usePlanningStore((state) => state.sprints);
  const updateTicket = usePlanningStore((state) => state.updateTicket);
  const deleteTicket = usePlanningStore((state) => state.deleteTicket);

  if (!ticket) {
    return null;
  }

  const handleDelete = () => {
    deleteTicket(ticket.id);
    onClose();
  };

  return (
    <aside
      aria-label={t(I18nKey.PLANNING$TICKET_DETAILS)}
      data-testid="ticket-panel"
      className="flex w-80 shrink-0 flex-col gap-3 rounded-lg border border-border bg-surface-raised p-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-content">
          {t(I18nKey.PLANNING$TICKET_DETAILS)}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-muted hover:text-content"
        >
          {t(I18nKey.BUTTON$CLOSE)}
        </button>
      </div>

      <Field label={t(I18nKey.PLANNING$TICKET_TITLE)}>
        <input
          className={FIELD_CLASS}
          value={ticket.title}
          onChange={(event) =>
            updateTicket(ticket.id, { title: event.target.value })
          }
        />
      </Field>

      <Field label={t(I18nKey.FORM$DESCRIPTION)}>
        <textarea
          className={FIELD_CLASS}
          rows={3}
          value={ticket.description}
          onChange={(event) =>
            updateTicket(ticket.id, { description: event.target.value })
          }
        />
      </Field>

      <Field label={t(I18nKey.COMMON$STATUS)}>
        <select
          className={FIELD_CLASS}
          value={ticket.status}
          onChange={(event) =>
            updateTicket(ticket.id, {
              status: event.target.value as TicketStatus,
            })
          }
        >
          {TICKET_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(STATUS_LABEL_KEYS[status])}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t(I18nKey.PLANNING$PRIORITY)}>
        <select
          className={FIELD_CLASS}
          value={ticket.priority}
          onChange={(event) =>
            updateTicket(ticket.id, {
              priority: event.target.value as TicketPriority,
            })
          }
        >
          {TICKET_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {t(PRIORITY_LABEL_KEYS[priority])}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t(I18nKey.PLANNING$ASSIGNEE)}>
        <select
          className={FIELD_CLASS}
          value={ticket.assignee}
          onChange={(event) =>
            updateTicket(ticket.id, {
              assignee: event.target.value as TicketAssignee,
            })
          }
        >
          {TICKET_ASSIGNEES.map((assignee) => (
            <option key={assignee} value={assignee}>
              {t(ASSIGNEE_LABEL_KEYS[assignee])}
            </option>
          ))}
        </select>
      </Field>

      {ticket.assignee === "agent" && (
        <Field label={t(I18nKey.PLANNING$AGENT_NAME)}>
          <input
            className={FIELD_CLASS}
            value={ticket.agentLabel ?? ""}
            onChange={(event) =>
              updateTicket(ticket.id, { agentLabel: event.target.value })
            }
          />
        </Field>
      )}

      <Field label={t(I18nKey.PLANNING$TAB_SPRINT)}>
        <select
          className={FIELD_CLASS}
          value={ticket.sprintId ?? ""}
          onChange={(event) =>
            updateTicket(ticket.id, { sprintId: event.target.value || null })
          }
        >
          <option value="">{t(I18nKey.PLANNING$NO_SPRINT)}</option>
          {sprints.map((sprint) => (
            <option key={sprint.id} value={sprint.id}>
              {sprint.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label={t(I18nKey.PLANNING$START_DATE)}>
          <input
            type="date"
            className={FIELD_CLASS}
            value={ticket.startDate ?? ""}
            onChange={(event) =>
              updateTicket(ticket.id, { startDate: event.target.value || null })
            }
          />
        </Field>
        <Field label={t(I18nKey.PLANNING$DUE_DATE)}>
          <input
            type="date"
            className={FIELD_CLASS}
            value={ticket.dueDate ?? ""}
            onChange={(event) =>
              updateTicket(ticket.id, { dueDate: event.target.value || null })
            }
          />
        </Field>
      </div>

      <Field label={t(I18nKey.PLANNING$ESTIMATE)}>
        <input
          type="number"
          min={0}
          className={FIELD_CLASS}
          value={ticket.estimate}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isFinite(value) && value >= 0) {
              updateTicket(ticket.id, { estimate: value });
            }
          }}
        />
      </Field>

      <Field label={t(I18nKey.PLANNING$LABELS)}>
        <input
          key={ticket.id}
          className={FIELD_CLASS}
          defaultValue={ticket.labels.join(", ")}
          onBlur={(event) =>
            updateTicket(ticket.id, { labels: parseLabels(event.target.value) })
          }
        />
      </Field>

      <button
        type="button"
        onClick={handleDelete}
        className="self-start text-sm text-danger hover:underline"
      >
        {t(I18nKey.PLANNING$DELETE_TICKET)}
      </button>
    </aside>
  );
}
