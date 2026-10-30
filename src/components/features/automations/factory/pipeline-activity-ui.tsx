import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import type { PrState, StepActivity } from "./pipeline-activity";

const PR_STYLE: Record<PrState, string> = {
  open: "border-success/40 bg-success/10 text-success",
  merged: "border-border bg-surface-raised text-contrast",
  draft: "border-dashed border-border bg-surface text-muted",
  failing: "border-danger/40 bg-danger/10 text-danger",
};

const PR_LABEL: Record<PrState, I18nKey> = {
  open: I18nKey.FACTORY$PR_OPEN,
  merged: I18nKey.FACTORY$PR_MERGED,
  draft: I18nKey.FACTORY$PR_DRAFT,
  failing: I18nKey.FACTORY$PR_FAILING,
};

/** A pull request number, colored by where it stands. */
export function PrChip({ number, state }: { number: number; state: PrState }) {
  const { t } = useTranslation("openhands");
  return (
    <span
      data-testid="pipeline-pr-chip"
      data-state={state}
      title={`#${number} · ${t(PR_LABEL[state])}`}
      className={cn(
        "rounded-full border px-1.5 font-mono text-xs leading-4",
        PR_STYLE[state],
      )}
    >
      {`#${number}`}
    </span>
  );
}

export function TicketChip({ id }: { id: string }) {
  return (
    <span
      data-testid="pipeline-ticket-chip"
      className="rounded-full border border-border bg-surface px-1.5 font-mono text-xs leading-4 text-muted"
    >
      {id}
    </span>
  );
}

/** Initials of the agents working a step, stacked. */
export function AgentStack({ names }: { names: string[] }) {
  return (
    <span className="flex -space-x-1" data-testid="pipeline-agent-stack">
      {names.map((name, i) => (
        <span
          // The same persona can appear twice; order is the identity.

          key={`${name}-${i}`}
          title={name}
          className="flex size-4 items-center justify-center rounded-full border border-canvas-base bg-surface-raised text-xs font-semibold text-contrast"
        >
          {name.slice(0, 1)}
        </span>
      ))}
    </span>
  );
}

/** Corner marks: a pulsing dot while work is running, plus queue and blocked counts. */
export function ActivityMarks({ activity }: { activity: StepActivity }) {
  const { t } = useTranslation("openhands");
  const active = activity.live > 0;
  const stuck = activity.blocked > 0;
  return (
    <>
      {active || stuck ? (
        <span
          data-testid="pipeline-status-dot"
          data-state={stuck ? "blocked" : "live"}
          className="absolute -left-1 -top-1 flex size-3"
        >
          {active ? (
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
          ) : null}
          <span
            className={cn(
              "relative inline-flex size-3 rounded-full border-2 border-canvas-base",
              stuck ? "bg-warning" : "bg-success",
            )}
          />
        </span>
      ) : null}
      <span className="absolute -right-2 -top-2 flex gap-0.5">
        {activity.queued > 0 ? (
          <span
            data-testid="pipeline-queue-bubble"
            title={t(I18nKey.FACTORY$ACTIVITY_QUEUED, {
              count: activity.queued,
            })}
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-contrast px-1 text-xs font-semibold leading-none text-contrast-foreground"
          >
            {activity.queued}
          </span>
        ) : null}
        {activity.blocked > 0 ? (
          <span
            data-testid="pipeline-blocked-bubble"
            title={t(I18nKey.FACTORY$ACTIVITY_BLOCKED, {
              count: activity.blocked,
            })}
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-warning px-1 text-xs font-semibold leading-none text-canvas-base"
          >
            {activity.blocked}
          </span>
        ) : null}
      </span>
    </>
  );
}

/** Chips that hang off the bottom edge of a step: pull requests, tickets, agents. */
export function HangingChips({ activity }: { activity: StepActivity }) {
  const prs = activity.prs.slice(0, 3);
  const extra = activity.prs.length - prs.length;
  if (!prs.length && !activity.tickets.length && !activity.agents.length)
    return null;
  return (
    <span className="absolute -bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap">
      {activity.agents.length ? <AgentStack names={activity.agents} /> : null}
      {prs.map((p) => (
        <PrChip key={p.number} number={p.number} state={p.state} />
      ))}
      {extra > 0 ? (
        <span className="text-xs text-muted">{`+${extra}`}</span>
      ) : null}
      {activity.tickets.slice(0, 2).map((id) => (
        <TicketChip key={id} id={id} />
      ))}
    </span>
  );
}

const formatMinutes = (m: number): string =>
  m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;

/** The full set of facts about a step, for the inspector. */
export function ActivityDetails({
  activity,
  sample,
}: {
  activity: StepActivity;
  sample: boolean;
}) {
  const { t } = useTranslation("openhands");
  return (
    <div
      data-testid="pipeline-activity-details"
      className="mt-2 flex flex-col gap-2"
    >
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        {activity.live > 0 ? (
          <span className="rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-success">
            {t(I18nKey.FEED$FACTORY_LIVE, { count: activity.live })}
          </span>
        ) : null}
        {activity.queued > 0 ? (
          <span className="rounded-full border border-border bg-surface px-2 py-0.5 text-contrast">
            {t(I18nKey.FACTORY$ACTIVITY_QUEUED, { count: activity.queued })}
          </span>
        ) : null}
        {activity.blocked > 0 ? (
          <span className="rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-warning">
            {t(I18nKey.FACTORY$ACTIVITY_BLOCKED, { count: activity.blocked })}
          </span>
        ) : null}
        {activity.waitMinutes !== null ? (
          <span className="text-muted">
            {t(I18nKey.FACTORY$ACTIVITY_WAIT, {
              time: formatMinutes(activity.waitMinutes),
            })}
          </span>
        ) : null}
        {activity.perDay !== null ? (
          <span className="text-muted">
            {t(I18nKey.FACTORY$ACTIVITY_PER_DAY, { count: activity.perDay })}
          </span>
        ) : null}
        {activity.lastMinutesAgo !== null ? (
          <span className="text-muted">
            {t(I18nKey.FACTORY$ACTIVITY_LAST, {
              time: formatMinutes(activity.lastMinutesAgo),
            })}
          </span>
        ) : null}
        {sample ? (
          <span className="rounded-full border border-dashed border-border px-2 py-0.5 text-muted">
            {t(I18nKey.FACTORY$ACTIVITY_SAMPLE)}
          </span>
        ) : null}
      </div>
      {activity.prs.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">
            {t(I18nKey.FACTORY$ACTIVITY_PRS)}
          </span>
          {activity.prs.map((p) => (
            <PrChip key={p.number} number={p.number} state={p.state} />
          ))}
        </div>
      ) : null}
      {activity.tickets.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">
            {t(I18nKey.FACTORY$ACTIVITY_TICKETS)}
          </span>
          {activity.tickets.map((id) => (
            <TicketChip key={id} id={id} />
          ))}
        </div>
      ) : null}
      {activity.agents.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">
            {t(I18nKey.FACTORY$ACTIVITY_AGENTS)}
          </span>
          <AgentStack names={activity.agents} />
          <span className="text-xs text-contrast">
            {[...new Set(activity.agents)].join(", ")}
          </span>
        </div>
      ) : null}
    </div>
  );
}
