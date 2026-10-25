/* eslint-disable i18next/no-literal-string -- dev-only prototype, not product copy */
import React from "react";
import { ExternalLink, MessageCircle, Wrench } from "lucide-react";
import { cn } from "#/utils/utils";
import { KamijiMochi } from "./kamiji-mochi";
import { KamijiProp } from "./kamiji-prop";
import {
  KAMIJI_PROPS,
  type KamijiMochiId,
  type KamijiPropName,
} from "./kamiji-catalog";
import type { KamijiMochiClip } from "./kamiji-mochi-expressions";
import type { KamijiExpression } from "./kamiji-expressions";

// ------------------------------------------------------------------ roster
type AgentStatus = "running" | "done" | "error" | "waiting";
const STATUS_ORDER: AgentStatus[] = ["running", "waiting", "done", "error"];
const STATUS_BADGE: Record<AgentStatus, string> = {
  running: "bg-primary/15 text-primary",
  waiting: "bg-warning/15 text-warning",
  done: "bg-success/15 text-success",
  error: "bg-danger/15 text-danger",
};
const FACE_CYCLE_MS = 2600;

interface RosterAgent {
  name: string;
  role: string;
  mochi: KamijiMochiId;
  accent: string;
  /** Clip while running; the other statuses share one clip each. */
  runningClip: KamijiMochiClip;
  initial: AgentStatus;
  task: string;
}

const ROSTER: RosterAgent[] = [
  {
    name: "Kumo",
    role: "Planner",
    mochi: "kamikin-kumo",
    accent: "#ffd23f",
    runningClip: "sit",
    initial: "running",
    task: "Splitting the login bug into three steps",
  },
  {
    name: "Player",
    role: "Coder",
    mochi: "kamikin-player",
    accent: "#ff7a59",
    runningClip: "walk",
    initial: "running",
    task: "Patching the token refresh retry",
  },
  {
    name: "Pip",
    role: "Tester",
    mochi: "kamikin-pip",
    accent: "#c77dff",
    runningClip: "hop",
    initial: "waiting",
    task: "Needs approval to run the e2e suite",
  },
  {
    name: "Panda",
    role: "Reviewer",
    mochi: "kamikin-player-panda-2",
    accent: "#4cc9f0",
    runningClip: "idle",
    initial: "done",
    task: "Approved the diff, two nits",
  },
  {
    name: "Hana",
    role: "Scout",
    mochi: "kamikin-hana",
    accent: "#7bd88f",
    runningClip: "run",
    initial: "running",
    task: "Searching for other refresh callers",
  },
  {
    name: "Cat",
    role: "Janitor",
    mochi: "kamikin-player-cat-5",
    accent: "#ffb703",
    runningClip: "walk",
    initial: "error",
    task: "Lockfile cleanup failed on merge",
  },
];

const STATUS_CLIP: Record<Exclude<AgentStatus, "running">, KamijiMochiClip> = {
  done: "happy",
  error: "sad",
  waiting: "wave",
};

/** running alternates thinking and neutral (plus the mochi's own blink); others hold one face. */
function statusExpression(status: AgentStatus, beat: number): KamijiExpression {
  if (status === "done") return "happy";
  if (status === "error") return "sad";
  if (status === "waiting") return "surprised";
  return beat % 2 === 0 ? "thinking" : "neutral";
}

function useBeat() {
  const [beat, setBeat] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => setBeat((n) => n + 1), FACE_CYCLE_MS);
    return () => window.clearInterval(id);
  }, []);
  return beat;
}

function RosterCard({ agent, beat }: { agent: RosterAgent; beat: number }) {
  const [status, setStatus] = React.useState(agent.initial);
  const clip = status === "running" ? agent.runningClip : STATUS_CLIP[status];
  const next = STATUS_ORDER[(STATUS_ORDER.indexOf(status) + 1) % 4];
  return (
    <article
      data-testid={`roster-${agent.role.toLowerCase()}`}
      ref={(el) => el?.style.setProperty("--accent", agent.accent)}
      className="flex flex-col items-center gap-2 rounded-2xl border border-border border-t-4 border-t-(--accent) bg-surface p-4"
    >
      <KamijiMochi
        character={agent.mochi}
        expression={statusExpression(status, beat)}
        animation={clip}
        size={112}
        alt={agent.name}
      />
      <div className="text-center">
        <p className="text-sm font-semibold text-contrast">{agent.name}</p>
        <span className="rounded-full bg-(--accent)/20 px-2 py-0.5 text-xs text-contrast">
          {agent.role}
        </span>
      </div>
      <button
        type="button"
        onClick={() => setStatus(next)}
        title={`Click to set ${next}`}
        className={cn(
          "rounded-full px-2.5 py-0.5 text-xs",
          STATUS_BADGE[status],
        )}
      >
        {status} · {clip}
      </button>
      <p className="text-center text-xs text-muted">{agent.task}</p>
    </article>
  );
}

function RosterSection() {
  const beat = useBeat();
  return (
    <section
      className="flex w-full flex-col gap-3"
      data-testid="kamikin-roster"
    >
      <h2 className="text-base font-semibold">Kamikin agent roster</h2>
      <p className="text-xs text-muted">
        Click a status badge to cycle running, waiting, done, error. Running
        alternates thinking and neutral faces; the clip follows the role.
      </p>
      <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
        {ROSTER.map((agent) => (
          <RosterCard key={agent.role} agent={agent} beat={beat} />
        ))}
      </div>
    </section>
  );
}

// -------------------------------------------------------------------- feed
interface FeedUpdate {
  author: string;
  mochi: KamijiMochiId;
  accent: string;
  text: string;
  kind: "agent" | "subagent";
  expression: KamijiExpression;
  animation: KamijiMochiClip;
}

const COMMENT_AGENT = { name: "Coder", accent: "#ff7a59" };
const FEED_UPDATES: FeedUpdate[] = [
  {
    author: "Coder",
    mochi: "kamikin-player",
    accent: "#ff7a59",
    kind: "agent",
    text: "Patched the retry so the refresh runs once per request.",
    expression: "excited",
    animation: "walk",
  },
  {
    author: "Tester",
    mochi: "kamikin-pip",
    accent: "#c77dff",
    kind: "subagent",
    text: "One regression: the logout test now hangs.",
    expression: "surprised",
    animation: "hop",
  },
  {
    author: "Fixer",
    mochi: "kamikin-kumo",
    accent: "#ffb703",
    kind: "subagent",
    text: "The mock never resolves the refresh promise. Fixing in teardown.",
    expression: "angry",
    animation: "idle",
  },
];

type FeedVariant =
  | "current"
  | "compact"
  | "accent"
  | "tinted"
  | "thread"
  | "bubbles";
const FEED_VARIANTS: { id: FeedVariant; name: string }[] = [
  { id: "current", name: "Current" },
  { id: "compact", name: "Compact" },
  { id: "accent", name: "Agent accent" },
  { id: "tinted", name: "Tinted" },
  { id: "thread", name: "Thread" },
  { id: "bubbles", name: "Chat bubbles" },
];

/** Full-body mochi standing in a tall slot; the square canvas overflows sideways, transparently. */
function FeedAvatar({ update, px }: { update: FeedUpdate; px: number }) {
  return (
    <span
      style={
        {
          "--w": `${Math.round(px * 1.5)}px`,
          "--h": `${px * 2}px`,
        } as React.CSSProperties
      }
      className="flex h-(--h) w-(--w) shrink-0 items-end justify-center"
    >
      <KamijiMochi
        character={update.mochi}
        expression={update.expression}
        animation={update.animation}
        frame="full"
        size={px * 2}
        alt={update.author}
      />
    </span>
  );
}

function FeedUpdateRow({
  update,
  variant,
}: {
  update: FeedUpdate;
  variant: FeedVariant;
}) {
  const isSub = update.kind === "subagent";
  const bubble =
    variant === "tinted"
      ? "rounded-2xl bg-(--accent)/12 px-3 py-2"
      : variant === "bubbles"
        ? "rounded-2xl rounded-tl-sm border border-(--accent)/50 bg-surface px-3 py-2"
        : variant === "compact"
          ? "py-1"
          : "rounded-2xl bg-surface px-3 py-2";
  return (
    <li className="flex items-start gap-2">
      <FeedAvatar update={update} px={isSub ? 28 : 32} />
      <div
        className={cn("min-w-0", bubble)}
        ref={(el) => el?.style.setProperty("--accent", update.accent)}
      >
        <p className="text-xs">
          <span className="font-semibold text-contrast">{update.author}</span>
          {isSub ? (
            <span className="ml-2 text-muted">subagent · Coder</span>
          ) : null}
          <span className="ml-2 text-muted">1m ago</span>
        </p>
        <p className="mt-0.5 text-sm text-contrast">{update.text}</p>
      </div>
    </li>
  );
}

const FEED_SHELL: Record<FeedVariant, string> = {
  current: "rounded-xl border border-border bg-surface-raised p-4",
  compact: "border-b border-border px-1 py-3",
  accent:
    "rounded-xl border border-border border-l-4 border-l-(--accent) bg-surface-raised p-4",
  tinted: "rounded-xl border border-(--accent)/30 bg-(--accent)/8 p-4",
  thread: "rounded-xl border border-border bg-surface-raised p-4",
  bubbles: "rounded-3xl border border-border bg-surface-raised p-5",
};

function FeedCardSample({ variant }: { variant: FeedVariant }) {
  const shown = variant === "compact" ? FEED_UPDATES.slice(0, 1) : FEED_UPDATES;
  const tintedBadge = variant === "accent" || variant === "tinted";
  return (
    <article
      data-testid={`kamiji-feed-${variant}`}
      ref={(el) => el?.style.setProperty("--accent", COMMENT_AGENT.accent)}
      className={cn("flex flex-col gap-3", FEED_SHELL[variant])}
    >
      <header className="flex items-center gap-3">
        <FeedAvatar
          update={FEED_UPDATES[0]}
          px={variant === "compact" ? 32 : variant === "bubbles" ? 56 : 40}
        />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-contrast">
            {COMMENT_AGENT.name}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-normal",
                tintedBadge
                  ? "bg-(--accent)/20 text-contrast"
                  : "bg-primary/15 text-primary",
              )}
            >
              Worker · T3 Opus
            </span>
            <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-normal text-success">
              Live
            </span>
          </p>
          <p className="text-xs text-muted">2m ago · running</p>
        </div>
        <ExternalLink size={16} className="text-muted" />
      </header>
      <p className="text-base text-contrast">Fix login after token refresh</p>
      <ul
        className={cn(
          "flex flex-col gap-2",
          variant === "thread" && "ml-4 border-l-2 border-border pl-4",
        )}
      >
        {shown.map((update) => (
          <FeedUpdateRow
            key={update.author}
            update={update}
            variant={variant}
          />
        ))}
      </ul>
      <div className="flex items-center gap-2 text-xs text-muted">
        <MessageCircle size={14} /> Reply…
      </div>
    </article>
  );
}

function NotificationRow() {
  return (
    <div
      data-testid="kamiji-notification-row"
      className="flex items-center gap-3 rounded-xl border border-border bg-surface-raised px-3 py-2"
    >
      <span className="relative">
        <KamijiMochi
          character="kamikin-pip"
          expression="happy"
          animation="happy"
          size={44}
          alt="Tester"
        />
        <span className="absolute -bottom-1 -right-1">
          <KamijiProp name="check" size={22} />
        </span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-contrast">
          <span className="font-semibold">Tester</span> passed 42 checks on{" "}
          <span className="font-medium">Fix login after token refresh</span>
        </p>
        <p className="text-xs text-muted">just now</p>
      </div>
      <Wrench size={14} className="text-muted" />
    </div>
  );
}

const REACTIONS: { prop: KamijiPropName; count: number }[] = [
  { prop: "heart", count: 3 },
  { prop: "star", count: 1 },
  { prop: "check", count: 5 },
  { prop: "fire", count: 2 },
];

function ReactionBar() {
  const [picked, setPicked] = React.useState<Set<KamijiPropName>>(new Set());
  const toggle = (name: KamijiPropName) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  return (
    <div className="flex flex-wrap gap-2" data-testid="kamiji-reaction-bar">
      {REACTIONS.map(({ prop, count }) => (
        <button
          key={prop}
          type="button"
          aria-pressed={picked.has(prop)}
          onClick={() => toggle(prop)}
          className={cn(
            "flex items-center gap-1 rounded-full border px-2 py-1 text-xs",
            picked.has(prop)
              ? "border-primary bg-primary/10 text-contrast"
              : "border-border bg-surface hover:bg-interactive-hover",
          )}
        >
          <KamijiProp name={prop} size={24} spin={picked.has(prop)} />
          {count + (picked.has(prop) ? 1 : 0)}
        </button>
      ))}
    </div>
  );
}

function FeedSection() {
  return (
    <section
      className="flex w-full flex-col gap-4"
      data-testid="kamiji-feed-elements"
    >
      <h2 className="text-base font-semibold">Feed elements</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {FEED_VARIANTS.map(({ id, name }) => (
          <div key={id} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">{name}</h3>
            <FeedCardSample variant={id} />
          </div>
        ))}
      </div>
      <h3 className="text-sm font-semibold">Notification row</h3>
      <NotificationRow />
      <h3 className="text-sm font-semibold">Reaction bar</h3>
      <ReactionBar />
    </section>
  );
}

// ------------------------------------------------------------------- props
function PropsSection() {
  return (
    <section
      className="flex w-full flex-col gap-3"
      data-testid="kamiji-props-gallery"
    >
      <h2 className="text-base font-semibold">Props gallery</h2>
      <div className="grid w-full grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {KAMIJI_PROPS.map((prop) => (
          <figure
            key={prop.name}
            className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-3"
          >
            <KamijiProp name={prop.name} size={72} />
            <figcaption className="text-center text-xs">
              <div className="break-all font-medium text-contrast">
                {prop.name}
              </div>
              <div className="text-muted">{prop.category}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export function KamijiMochiShowcase() {
  return (
    <>
      <RosterSection />
      <FeedSection />
      <PropsSection />
    </>
  );
}
