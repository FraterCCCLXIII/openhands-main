/* eslint-disable i18next/no-literal-string -- dev-only style sheet, not product copy */
import React from "react";
import { Navigate } from "react-router";
import { ExternalLink, MessageCircle, Wrench } from "lucide-react";
import { KamijiAvatar } from "#/components/features/kamiji/kamiji-avatar";
import type {
  KamijiAnimation,
  KamijiExpression,
} from "#/components/features/kamiji/kamiji-expressions";
import { cn } from "#/utils/utils";

interface SampleUpdate {
  author: string;
  color: string;
  text: string;
  kind: "agent" | "action" | "subagent";
  expression: KamijiExpression;
  animation: KamijiAnimation;
}

const AGENT = { name: "Coder", color: "#ff7a59" };

const UPDATES: SampleUpdate[] = [
  {
    author: "Coder",
    color: AGENT.color,
    kind: "agent",
    text: "Patched the retry so the refresh runs once per request.",
    expression: "excited",
    animation: "Typing",
  },
  {
    author: "Tester",
    color: "#c77dff",
    kind: "subagent",
    text: "One regression: the logout test now hangs.",
    expression: "surprised",
    animation: "Bounce",
  },
  {
    author: "Fixer",
    color: "#ffb703",
    kind: "subagent",
    text: "The mock never resolves the refresh promise. Fixing in teardown.",
    expression: "angry",
    animation: "Spin",
  },
];

type Variant =
  | "current"
  | "compact"
  | "accent"
  | "tinted"
  | "thread"
  | "bubbles";

const VARIANTS: { id: Variant; name: string; note: string }[] = [
  {
    id: "current",
    name: "Current",
    note: "Bordered raised card, round 40px avatar, grey comment bubbles.",
  },
  {
    id: "compact",
    name: "Compact",
    note: "Borderless rows with a hairline divider, 32px avatar, one-line preview.",
  },
  {
    id: "accent",
    name: "Agent accent",
    note: "Left rail and badge take the agent's Kamiji colour.",
  },
  {
    id: "tinted",
    name: "Tinted",
    note: "Card wash and comment bubbles tinted by the agent colour.",
  },
  {
    id: "thread",
    name: "Thread",
    note: "Subagent replies hang off a connector line under the post.",
  },
  {
    id: "bubbles",
    name: "Chat bubbles",
    note: "Large Kamiji beside the post; each update is a speech bubble.",
  },
];

function Avatar({
  update,
  size,
}: {
  update: Pick<SampleUpdate, "color" | "expression" | "animation">;
  size: number;
}) {
  return (
    <span
      className="flex shrink-0 items-center justify-center"
      ref={(el) => {
        el?.style.setProperty("width", `${size}px`);
        el?.style.setProperty("height", `${size}px`);
      }}
    >
      <KamijiAvatar
        size={size}
        color={update.color}
        expression={update.expression}
        animation={update.animation}
      />
    </span>
  );
}

function Header({ variant }: { variant: Variant }) {
  const size = variant === "compact" ? 32 : variant === "bubbles" ? 56 : 40;
  const lead = UPDATES[0];
  return (
    <header className="flex items-center gap-3">
      <Avatar update={lead} size={size} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-contrast">
          {AGENT.name}
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-normal",
              variant === "accent" || variant === "tinted"
                ? "bg-(--accent)/20 text-(--accent)"
                : "bg-sky-500/15 text-sky-300",
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
  );
}

function Update({
  update,
  variant,
}: {
  update: SampleUpdate;
  variant: Variant;
}) {
  const isSub = update.kind === "subagent";
  const bubble =
    variant === "tinted"
      ? "rounded-2xl bg-(--accent)/12 px-3 py-2"
      : variant === "bubbles"
        ? "rounded-2xl rounded-tl-sm bg-surface px-3 py-2 border border-(--accent)/50"
        : variant === "compact"
          ? "py-1"
          : "rounded-2xl bg-surface px-3 py-2";
  return (
    <li className="flex items-start gap-2">
      {update.kind === "action" ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface">
          <Wrench size={14} />
        </span>
      ) : (
        <Avatar update={update} size={isSub ? 28 : 32} />
      )}
      <div
        className={cn("min-w-0", bubble)}
        ref={(el) => el?.style.setProperty("--accent", update.color)}
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

function SampleCard({ variant }: { variant: Variant }) {
  const shell: Record<Variant, string> = {
    current: "rounded-xl border border-border bg-surface-raised p-4",
    compact: "border-b border-border px-1 py-3",
    accent:
      "rounded-xl border border-border border-l-4 border-l-(--accent) bg-surface-raised p-4",
    tinted: "rounded-xl border border-(--accent)/30 bg-(--accent)/8 p-4",
    thread: "rounded-xl border border-border bg-surface-raised p-4",
    bubbles: "rounded-3xl border border-border bg-surface-raised p-5",
  };
  const shown = variant === "compact" ? UPDATES.slice(0, 1) : UPDATES;
  return (
    <article
      data-testid={`feed-style-${variant}`}
      className={cn("flex flex-col gap-3", shell[variant])}
      ref={(el) => el?.style.setProperty("--accent", AGENT.color)}
    >
      <Header variant={variant} />
      <p className="text-base text-contrast">Fix login after token refresh</p>
      <ul
        className={cn(
          "flex flex-col gap-2",
          variant === "thread" && "ml-4 border-l-2 border-border pl-4",
        )}
      >
        {shown.map((update) => (
          <Update key={update.author} update={update} variant={variant} />
        ))}
      </ul>
      <div className="flex items-center gap-2 text-xs text-muted">
        <MessageCircle size={14} /> Reply…
      </div>
    </article>
  );
}

export default function MockFeedStyles() {
  if (import.meta.env.VITE_MOCK_API !== "true") {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="h-full overflow-y-auto bg-canvas-base text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
        <header>
          <h1 className="text-xl font-semibold">Feed card styles</h1>
          <p className="text-sm text-muted">
            Variants of the current FeedCard, same sample conversation.
          </p>
        </header>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {VARIANTS.map(({ id, name, note }) => (
            <section key={id} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">{name}</h2>
              <p className="text-xs text-muted">{note}</p>
              <SampleCard variant={id} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
