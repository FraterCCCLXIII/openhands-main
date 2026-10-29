import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { I18nKey } from "#/i18n/declaration";
import { ExecutionStatus } from "#/types/agent-server/core";
import { pickFeedDemoAgent } from "#/utils/feed-demo-agents";
import { cn } from "#/utils/utils";

const DAY = 86_400_000;
const WEEK = 7 * DAY;
const LABEL_WIDTH = 224;

type Zoom = "month" | "quarter" | "all";

const PIXELS_PER_DAY: Record<Zoom, number> = {
  month: 26,
  quarter: 11,
  all: 4.2,
};

const MIN_SPAN_DAYS: Record<Zoom, number> = {
  month: 56,
  quarter: 112,
  all: 280,
};

export interface ScheduleRow {
  id: string;
  title: string;
  start: number;
  end: number;
  /** Still running: the bar fades out on the right. */
  ongoing: boolean;
  failed: boolean;
}

export interface ScheduleGroup {
  agent: string;
  rows: ScheduleRow[];
}

/** Conversations as bars from creation to last activity, grouped by agent. */
export function buildSchedule(
  conversations: AppConversation[],
  now: number,
): ScheduleGroup[] {
  const groups = new Map<string, ScheduleRow[]>();
  conversations.forEach((conversation) => {
    const start = Date.parse(conversation.created_at);
    if (Number.isNaN(start)) return;
    const ongoing = conversation.execution_status === ExecutionStatus.RUNNING;
    const updated = Date.parse(conversation.updated_at);
    const end = ongoing
      ? Math.max(now, start + DAY)
      : Math.max(Number.isNaN(updated) ? start : updated, start + DAY / 2);
    const agent = pickFeedDemoAgent(conversation.id).name;
    const rows = groups.get(agent) ?? [];
    rows.push({
      id: conversation.id,
      title: conversation.title ?? conversation.id,
      start,
      end,
      ongoing,
      failed: conversation.execution_status === ExecutionStatus.ERROR,
    });
    groups.set(agent, rows);
  });
  return [...groups.entries()]
    .map(([agent, rows]) => ({
      agent,
      rows: rows.sort((a, b) => a.start - b.start),
    }))
    .sort((a, b) => a.agent.localeCompare(b.agent));
}

const dayLabel = (time: number, locale: string): string =>
  new Date(time).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/**
 * A schedule of the factory's conversations: one bar each, grouped by agent,
 * on a weekly axis with a today line. Same layout as the Gantt in Projects.
 */
export function FactoryGantt({
  conversations,
}: {
  conversations: AppConversation[];
}) {
  const { t, i18n } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const [zoom, setZoom] = useState<Zoom>("quarter");
  const now = useMemo(() => Date.now(), []);
  const groups = useMemo(
    () => buildSchedule(conversations, now),
    [conversations, now],
  );

  if (groups.length === 0) {
    return (
      <p data-testid="factory-gantt-empty" className="text-sm text-muted">
        {t(I18nKey.FACTORY$SCHEDULE_EMPTY)}
      </p>
    );
  }

  const rows = groups.flatMap((group) => group.rows);
  let min = Math.min(now, ...rows.map((row) => row.start));
  let max = Math.max(now, ...rows.map((row) => row.end));
  if (zoom === "month") {
    min = now - 14 * DAY;
    max = Math.max(max, now + 28 * DAY);
  }
  min -= WEEK;
  max += 2 * WEEK;
  // Start the axis on a Monday.
  min -= ((new Date(min).getUTCDay() + 6) % 7) * DAY;
  const ppd = PIXELS_PER_DAY[zoom];
  const x = (time: number) => Math.round(((time - min) / DAY) * ppd);
  // Fill the card even when the work spans only a few days.
  max = Math.max(max, min + MIN_SPAN_DAYS[zoom] * DAY);
  const width = x(max);
  const ticks: number[] = [];
  for (let time = min; time <= max; time += WEEK) ticks.push(time);

  return (
    <div data-testid="factory-gantt" className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        {(
          [
            ["month", I18nKey.FACTORY$SCHEDULE_MONTH],
            ["quarter", I18nKey.FACTORY$SCHEDULE_QUARTER],
            ["all", I18nKey.FEED$ALL],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            data-testid={`factory-gantt-zoom-${key}`}
            aria-pressed={zoom === key}
            onClick={() => setZoom(key)}
            className={cn(
              "rounded-full px-3 py-1 text-xs",
              zoom === key
                ? "bg-contrast text-contrast-foreground"
                : "bg-surface text-muted hover:text-contrast",
            )}
          >
            {t(label)}
          </button>
        ))}
      </div>
      <div className="custom-scrollbar relative overflow-x-auto rounded-xl border border-border bg-surface">
        <div
          className="grid min-w-max"
          style={{ gridTemplateColumns: `${LABEL_WIDTH}px auto` }}
        >
          <div className="sticky left-0 z-10 border-r border-border bg-surface">
            <div className="h-10 border-b border-border" />
            {groups.map((group) => (
              <div key={group.agent}>
                <div className="flex h-8 items-center justify-between bg-base-secondary px-3 text-xs font-medium uppercase text-muted">
                  {group.agent}
                  <span className="font-normal">{group.rows.length}</span>
                </div>
                {group.rows.map((row) => (
                  <NavigationLink
                    key={row.id}
                    to={backendScopedPath(`/conversations/${row.id}`)}
                    data-testid="factory-gantt-row"
                    title={row.title}
                    className="flex h-8 items-center gap-2 border-b border-border px-3 text-sm text-foreground hover:bg-surface-raised"
                  >
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        row.failed
                          ? "bg-danger"
                          : row.ongoing
                            ? "bg-success"
                            : "bg-muted",
                      )}
                    />
                    <span className="truncate">{row.title}</span>
                  </NavigationLink>
                ))}
              </div>
            ))}
          </div>
          <div className="relative" style={{ width }}>
            <div className="relative h-10 border-b border-border">
              {ticks.map((time) => (
                <div
                  key={time}
                  className="absolute inset-y-0 border-l border-border pl-1 pt-1 font-mono text-xs text-muted"
                  style={{ left: x(time) }}
                >
                  {zoom === "all" && new Date(time).getUTCDate() > 7
                    ? ""
                    : dayLabel(time, i18n.language)}
                </div>
              ))}
            </div>
            {ticks.map((time) => (
              <div
                key={time}
                aria-hidden
                className="pointer-events-none absolute bottom-0 top-10 border-l border-border opacity-50"
                style={{ left: x(time) }}
              />
            ))}
            <div
              aria-hidden
              data-testid="factory-gantt-today"
              className="pointer-events-none absolute bottom-0 top-0 z-[1] border-l-2 border-danger"
              style={{ left: x(now) }}
            >
              <span className="absolute left-1 top-6 font-mono text-[10px] uppercase text-danger">
                {t(I18nKey.PLANNING$TODAY)}
              </span>
            </div>
            {groups.map((group) => (
              <div key={group.agent}>
                <div className="h-8 bg-base-secondary" />
                {group.rows.map((row) => {
                  const left = x(row.start);
                  const barWidth = Math.max(6, x(row.end) - left);
                  const color = row.failed
                    ? "var(--color-danger)"
                    : row.ongoing
                      ? "var(--color-success)"
                      : "var(--color-muted)";
                  return (
                    <div
                      key={row.id}
                      className="relative h-8 border-b border-border"
                    >
                      <div
                        data-testid="factory-gantt-bar"
                        title={`${row.title}\n${dayLabel(row.start, i18n.language)} – ${
                          row.ongoing
                            ? t(I18nKey.FACTORY$SCHEDULE_ONGOING)
                            : dayLabel(row.end, i18n.language)
                        }`}
                        className="absolute top-1.5 h-5 rounded-sm border"
                        style={{
                          left,
                          width: barWidth,
                          borderColor: color,
                          background: `color-mix(in srgb, ${color} 35%, transparent)`,
                          maskImage: row.ongoing
                            ? "linear-gradient(90deg, #000 85%, transparent)"
                            : undefined,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
