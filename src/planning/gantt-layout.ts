import { toDayNumber } from "./dates";
import type { IsoDate, Sprint, Ticket } from "./types";

export interface GanttRange {
  /** First visible day (inclusive). */
  startDay: number;
  /** Number of visible days. */
  totalDays: number;
}

export interface BarLayout {
  /** Offset from the left edge, in percent of the range. */
  leftPercent: number;
  /** Width in percent of the range; spans start through due, inclusive. */
  widthPercent: number;
}

export type DatedTicket = Ticket & { startDate: IsoDate; dueDate: IsoDate };

export function isDatedTicket(ticket: Ticket): ticket is DatedTicket {
  return ticket.startDate !== null && ticket.dueDate !== null;
}

/** Visible range covering every dated ticket, sprint, and the given day. */
export function computeGanttRange(
  tickets: readonly Ticket[],
  sprints: readonly Sprint[],
  today: IsoDate,
): GanttRange {
  const days = [toDayNumber(today)];
  tickets.filter(isDatedTicket).forEach((ticket) => {
    days.push(toDayNumber(ticket.startDate), toDayNumber(ticket.dueDate));
  });
  sprints.forEach((sprint) => {
    days.push(toDayNumber(sprint.startDate), toDayNumber(sprint.endDate));
  });
  const startDay = Math.min(...days);
  return { startDay, totalDays: Math.max(...days) - startDay + 1 };
}

export function computeBarLayout(
  startDate: IsoDate,
  dueDate: IsoDate,
  range: GanttRange,
): BarLayout {
  const start = toDayNumber(startDate);
  // A due date before the start still draws a one-day bar.
  const end = Math.max(toDayNumber(dueDate), start);
  return {
    leftPercent: ((start - range.startDay) / range.totalDays) * 100,
    widthPercent: ((end - start + 1) / range.totalDays) * 100,
  };
}

export function dayOffsetPercent(day: IsoDate, range: GanttRange): number {
  return ((toDayNumber(day) - range.startDay + 0.5) / range.totalDays) * 100;
}
