import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import type { FeedTeammate } from "#/utils/feed-team-demo";
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

/** A person's avatar badge: initials on their tint, with a dot when they are online. */
export function PersonBadge({ person }: { person: FeedTeammate }) {
  return (
    <span
      data-testid="pipeline-person-badge"
      title={`${person.name} · ${person.title}`}
      className={cn(
        "relative flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        person.className,
      )}
    >
      {person.initials}
      {person.online ? (
        <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-canvas-base bg-success" />
      ) : null}
    </span>
  );
}

/** The people in the loop at a human step, as badges with names, inside the node. */
export function HumansLine({ activity }: { activity: StepActivity }) {
  if (!activity.humans.length) return null;
  return (
    <span
      data-testid="pipeline-humans-line"
      className="mt-0.5 flex max-w-full items-center gap-1.5 rounded-full bg-surface px-1 py-0.5 text-xs leading-4 text-contrast"
    >
      {activity.humans.map((person) => (
        <span key={person.id} className="flex items-center gap-1 truncate">
          <PersonBadge person={person} />
          <span className="truncate font-medium">{person.name}</span>
        </span>
      ))}
    </span>
  );
}

/** The profile and model at a step, as one quiet line inside the node. */
export function ProfileLine({ activity }: { activity: StepActivity }) {
  const { t } = useTranslation("openhands");
  const { profile } = activity;
  if (!profile) return null;
  return (
    <span
      data-testid="pipeline-profile-line"
      className="mt-0.5 flex max-w-full items-center gap-1 truncate rounded-full bg-surface px-2 text-xs leading-4 text-contrast"
    >
      <span className="font-medium">{profile.name}</span>
      <span className="text-muted">
        {profile.model ?? t(I18nKey.FACTORY$ACTIVITY_NO_MODEL)}
      </span>
    </span>
  );
}

/** Pull requests, tickets and agents, as a row at the foot of a step. */
export function ChipRow({ activity }: { activity: StepActivity }) {
  const prs = activity.prs.slice(0, 3);
  const extra = activity.prs.length - prs.length;
  if (!prs.length && !activity.tickets.length && !activity.agents.length)
    return null;
  return (
    <span className="mt-1 flex max-w-full items-center gap-1 whitespace-nowrap">
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
      {activity.humans.length ? (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">
            {t(I18nKey.FACTORY$ACTIVITY_PERSON)}
          </span>
          {activity.humans.map((person) => (
            <span key={person.id} className="flex items-center gap-1">
              <PersonBadge person={person} />
              <span className="text-contrast">{person.name}</span>
              <span className="text-muted">{person.title}</span>
            </span>
          ))}
        </div>
      ) : null}
      {activity.profile ? (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted">
            {t(I18nKey.FACTORY$ACTIVITY_PROFILE)}
          </span>
          <span className="text-contrast">{`${activity.profile.name} (${activity.profile.role})`}</span>
          <span className="text-muted">
            {t(I18nKey.FACTORY$ACTIVITY_MODEL)}
          </span>
          <span className="text-contrast">
            {activity.profile.model ?? t(I18nKey.FACTORY$ACTIVITY_NO_MODEL)}
          </span>
        </div>
      ) : null}
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
