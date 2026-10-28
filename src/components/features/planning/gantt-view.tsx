import type { CSSProperties } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { todayIso } from "#/planning/dates";
import {
  computeBarLayout,
  computeGanttRange,
  dayOffsetPercent,
  isDatedTicket,
  type DatedTicket,
} from "#/planning/gantt-layout";
import type { IsoDate } from "#/planning/types";
import { usePlanningStore } from "#/stores/planning-store";

interface GanttViewProps {
  onSelectTicket: (id: string) => void;
  today?: IsoDate;
}

interface TicketGroup {
  key: string;
  name: string | null;
  tickets: DatedTicket[];
}

/** Numeric custom properties carry the measured geometry into classes. */
function percentVars(values: Record<string, number>): CSSProperties {
  return values as unknown as CSSProperties;
}

export function GanttView({ onSelectTicket, today }: GanttViewProps) {
  const { t } = useTranslation("openhands");
  const sprints = usePlanningStore((state) => state.sprints);
  const tickets = usePlanningStore((state) => state.tickets);
  const todayDate = today ?? todayIso();

  const dated = tickets.filter(isDatedTicket);
  if (dated.length === 0) {
    return (
      <p className="text-sm text-muted">
        {t(I18nKey.PLANNING$NO_DATED_TICKETS)}
      </p>
    );
  }

  const range = computeGanttRange(tickets, sprints, todayDate);
  const todayLeft = dayOffsetPercent(todayDate, range);

  const groups: TicketGroup[] = [
    ...sprints.map((sprint) => ({
      key: sprint.id,
      name: sprint.name,
      tickets: dated.filter((tk) => tk.sprintId === sprint.id),
    })),
    {
      key: "unscheduled",
      name: null,
      tickets: dated.filter(
        (tk) => !sprints.some((sprint) => sprint.id === tk.sprintId),
      ),
    },
  ].filter((group) => group.tickets.length > 0);

  return (
    <div className="flex flex-col gap-4" data-testid="gantt-view">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.name ?? undefined}>
          <h3 className="mb-1 text-xs font-semibold uppercase text-muted">
            {group.name ?? t(I18nKey.PLANNING$NO_SPRINT)}
          </h3>
          <ul className="flex flex-col gap-1">
            {group.tickets.map((ticket) => {
              const bar = computeBarLayout(
                ticket.startDate,
                ticket.dueDate,
                range,
              );
              return (
                <li key={ticket.id} className="flex items-center gap-2">
                  <span className="w-48 shrink-0 truncate text-sm text-content">
                    {ticket.title}
                  </span>
                  <div className="relative h-7 flex-1 rounded bg-surface">
                    <div
                      data-testid={`today-marker-${ticket.id}`}
                      title={t(I18nKey.PLANNING$TODAY)}
                      style={percentVars({ "--today-left": todayLeft })}
                      className="absolute inset-y-0 left-[calc(var(--today-left)*1%)] w-px bg-primary"
                    />
                    <button
                      type="button"
                      data-testid={`gantt-bar-${ticket.id}`}
                      aria-label={ticket.title}
                      onClick={() => onSelectTicket(ticket.id)}
                      style={percentVars({
                        "--bar-left": bar.leftPercent,
                        "--bar-width": bar.widthPercent,
                      })}
                      className="absolute inset-y-1 left-[calc(var(--bar-left)*1%)] w-[calc(var(--bar-width)*1%)] rounded bg-primary"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
