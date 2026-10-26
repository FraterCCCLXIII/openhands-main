/* eslint-disable i18next/no-literal-string -- dev-only prototype, not product copy */
import React from "react";
import { cn } from "#/utils/utils";
import { KamijiWithEmote, type KamijiEmoteType } from "./kamiji-emote";
import type {
  KamijiAnimation,
  KamijiExpression,
  KamijiPose,
} from "./kamiji-expressions";

interface SimTurn {
  name: string;
  /** Hex colour tinting this agent's Kamiji and its accents. */
  color: string;
  role: string;
  expression: KamijiExpression;
  animation: KamijiAnimation;
  pose: KamijiPose;
  emote?: KamijiEmoteType;
  emoteText?: string;
  text: string;
  /** Small attribute chips: tool, status, tokens, duration. */
  attrs?: string[];
}

interface SimMessage extends SimTurn {
  /** Subagent turns rendered inside the same message card. */
  subagents?: SimTurn[];
}

const SCRIPT: SimMessage[] = [
  {
    name: "Planner",
    color: "#ffd23f",
    role: "agent",
    expression: "thinking",
    animation: "Think",
    pose: "point",
    emote: "thoughtBubble",
    text: "Login fails after the token refresh. I'll split this into reproducing it, fixing it and reviewing the diff.",
    attrs: ["plan · 3 steps", "claude-sonnet"],
    subagents: [
      {
        name: "Repro",
        color: "#4cc9f0",
        role: "subagent · spawned by Planner",
        expression: "excited",
        animation: "Typing",
        pose: "open",
        emote: "lightbulb",
        text: "Reproduced: the refresh call runs twice and the second one 401s.",
        attrs: ["bash", "pytest -k refresh", "2.1s"],
      },
      {
        name: "Scout",
        color: "#7bd88f",
        role: "subagent · spawned by Planner",
        expression: "happy",
        animation: "TurnPoint",
        pose: "point",
        text: "The duplicate comes from auth-client.ts:88, which retries on every 401.",
        attrs: ["grep", "14 files", "0.4s"],
      },
    ],
  },
  {
    name: "Coder",
    color: "#ff7a59",
    role: "agent",
    expression: "excited",
    animation: "Typing",
    pose: "open",
    emote: "sparkle",
    text: "Patching the retry so it only fires once per request and the refresh is shared.",
    attrs: ["edit_file", "+12 −4", "auth-client.ts"],
    subagents: [
      {
        name: "Tester",
        color: "#c77dff",
        role: "subagent · spawned by Coder",
        expression: "surprised",
        animation: "Bounce",
        pose: "fist",
        emote: "exclamation",
        text: "One regression: the logout test now hangs.",
        attrs: ["pytest", "1 failed", "8.7s"],
      },
      {
        name: "Fixer",
        color: "#ffb703",
        role: "subagent · spawned by Coder",
        expression: "angry",
        animation: "Spin",
        pose: "fist",
        emote: "angerVein",
        text: "The mock never resolves the refresh promise. Resolving it in teardown.",
        attrs: ["edit_file", "+3 −0"],
      },
    ],
  },
  {
    name: "Reviewer",
    color: "#ef476f",
    role: "agent",
    expression: "happy",
    animation: "Celebrate",
    pose: "thumbsUp",
    emote: "heart",
    text: "All 212 tests pass and the diff is small. Approving.",
    attrs: ["review", "approved", "212 passed"],
  },
];

const STEP_MS = 2600;

function Attrs({ attrs, color }: { attrs?: string[]; color: string }) {
  if (!attrs?.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {attrs.map((attr) => (
        <span
          key={attr}
          className="rounded-full border px-2 py-0.5 text-xs text-muted border-(--accent)"
          style={{ "--accent": color } as React.CSSProperties}
        >
          {attr}
        </span>
      ))}
    </div>
  );
}

function Turn({ turn, size }: { turn: SimTurn; size: number }) {
  return (
    <div
      className="flex items-start gap-3 kamiji-sim-in"
      data-testid={`kamiji-sim-turn-${turn.name}`}
    >
      <KamijiWithEmote
        size={size}
        color={turn.color}
        expression={turn.expression}
        animation={turn.animation}
        pose={turn.pose}
        emote={turn.emote ?? null}
        emoteText={turn.emoteText}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span
            className="text-sm font-semibold text-(--accent)"
            style={{ "--accent": turn.color } as React.CSSProperties}
          >
            {turn.name}
          </span>
          <span className="text-xs text-muted">{turn.role}</span>
        </div>
        <p className="text-sm">{turn.text}</p>
        <Attrs attrs={turn.attrs} color={turn.color} />
      </div>
    </div>
  );
}

export function KamijiSimConversation() {
  const [visible, setVisible] = React.useState(1);
  const [runId, setRunId] = React.useState(0);
  // Each message reveals its subagents one by one, so count in sub-steps.
  const steps = React.useMemo(
    () =>
      SCRIPT.flatMap((m, i) => [
        [i, 0],
        ...(m.subagents ?? []).map((_, s) => [i, s + 1]),
      ]),
    [],
  );

  React.useEffect(() => {
    if (visible >= steps.length) return undefined;
    const id = window.setTimeout(() => setVisible((v) => v + 1), STEP_MS);
    return () => window.clearTimeout(id);
  }, [visible, steps.length, runId]);

  const shown = steps.slice(0, visible);

  return (
    <section
      className="flex w-full flex-col gap-3"
      data-testid="kamiji-sim-conversation"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Simulated conversation</h2>
        <button
          type="button"
          onClick={() => {
            setVisible(1);
            setRunId((r) => r + 1);
          }}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-surface-raised"
        >
          Replay
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {SCRIPT.map((message, i) => {
          const subCount = Math.max(
            -1,
            ...shown.filter(([mi]) => mi === i).map(([, s]) => s),
          );
          if (subCount < 0) return null;
          return (
            <article
              key={message.name}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4",
              )}
            >
              <Turn turn={message} size={72} />
              {(message.subagents ?? []).slice(0, subCount).map((sub) => (
                <div
                  key={sub.name}
                  className="ml-8 border-l-2 border-(--accent) pl-4"
                  style={{ "--accent": sub.color } as React.CSSProperties}
                >
                  <Turn turn={sub} size={52} />
                </div>
              ))}
            </article>
          );
        })}
      </div>
    </section>
  );
}
