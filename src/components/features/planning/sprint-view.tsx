import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import {
  PRIORITY_LABEL_KEYS,
  STATUS_LABEL_KEYS,
  TICKET_STATUSES,
} from "#/planning/constants";
import { todayIso } from "#/planning/dates";
import type { IsoDate, Sprint } from "#/planning/types";
import { usePlanningStore } from "#/stores/planning-store";

interface SprintViewProps {
  onSelectTicket: (id: string) => void;
  today?: IsoDate;
}

/** The sprint containing today, else the next one, else the latest. */
function pickActiveSprint(
  sprints: readonly Sprint[],
  today: IsoDate,
): Sprint | undefined {
  const sorted = [...sprints].sort((a, b) =>
    a.startDate.localeCompare(b.startDate),
  );
  return (
    sorted.find((s) => s.startDate <= today && today <= s.endDate) ??
    sorted.find((s) => s.startDate > today) ??
    sorted[sorted.length - 1]
  );
}

export function SprintView({ onSelectTicket, today }: SprintViewProps) {
  const { t } = useTranslation("openhands");
  const sprints = usePlanningStore((state) => state.sprints);
  const tickets = usePlanningStore((state) => state.tickets);
  const [chosenId, setChosenId] = useState<string | null>(null);

  const sprint =
    sprints.find((s) => s.id === chosenId) ??
    pickActiveSprint(sprints, today ?? todayIso());

  if (!sprint) {
    return (
      <p className="text-sm text-muted">{t(I18nKey.PLANNING$NO_SPRINTS)}</p>
    );
  }

  const sprintTickets = tickets.filter(
    (ticket) => ticket.sprintId === sprint.id,
  );
  const committed = sprintTickets.reduce((sum, tk) => sum + tk.estimate, 0);
  const done = sprintTickets
    .filter((tk) => tk.status === "done")
    .reduce((sum, tk) => sum + tk.estimate, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="flex items-center gap-2 text-sm text-muted">
          {t(I18nKey.PLANNING$TAB_SPRINT)}
          <select
            value={sprint.id}
            onChange={(event) => setChosenId(event.target.value)}
            className="rounded border border-border bg-surface px-2 py-1 text-content"
          >
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted">
          {t(I18nKey.PLANNING$SPRINT_RANGE, {
            start: sprint.startDate,
            end: sprint.endDate,
          })}
        </p>
        {sprint.goal && (
          <p data-testid="sprint-goal" className="text-sm text-content">
            {t(I18nKey.PLANNING$SPRINT_GOAL)}: {sprint.goal}
          </p>
        )}
        <p
          data-testid="sprint-points"
          className="text-sm font-medium text-content"
        >
          {t(I18nKey.PLANNING$POINTS_SUMMARY, { done, total: committed })}
        </p>
      </div>
      {TICKET_STATUSES.map((status) => {
        const group = sprintTickets.filter((tk) => tk.status === status);
        if (group.length === 0) return null;
        return (
          <section key={status} aria-label={t(STATUS_LABEL_KEYS[status])}>
            <h3 className="mb-1 text-xs font-semibold uppercase text-muted">
              {t(STATUS_LABEL_KEYS[status])}
            </h3>
            <ul className="flex flex-col gap-1">
              {group.map((ticket) => (
                <li key={ticket.id}>
                  <button
                    type="button"
                    onClick={() => onSelectTicket(ticket.id)}
                    className="flex w-full items-center justify-between rounded border border-border bg-surface-raised px-3 py-2 text-left text-sm text-content"
                  >
                    <span>{ticket.title}</span>
                    <span className="text-xs text-muted">
                      {t(PRIORITY_LABEL_KEYS[ticket.priority])} ·{" "}
                      {t(I18nKey.PLANNING$POINTS, { count: ticket.estimate })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
