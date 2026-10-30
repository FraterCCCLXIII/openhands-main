import { FEED_DEMO_AGENTS } from "#/utils/feed-demo-agents";
import { FEED_TEAMMATES, type FeedTeammate } from "#/utils/feed-team-demo";
import { getDemoAgentRole } from "#/utils/feed-agent-role";
import type { PipelineStep } from "./pipeline-templates";

export type PrState = "open" | "merged" | "draft" | "failing";

/** What is going on at one step of a pipeline: work in flight, waiting, and what it touched. */
export interface StepActivity {
  /** Running now. */
  live: number;
  /** Waiting for a worker or a slot. */
  queued: number;
  /** Waiting for a person or stuck. */
  blocked: number;
  prs: { number: number; state: PrState }[];
  tickets: string[];
  agents: string[];
  /** The agent profile that handles this step, and the model it runs (null when it runs none). */
  profile: { name: string; role: string; model: string | null } | null;
  /** People in the loop at a human step: who is asked to review, approve or sign off. */
  humans: FeedTeammate[];
  /** Average minutes an item waits here. */
  waitMinutes: number | null;
  perDay: number | null;
  lastMinutesAgo: number | null;
}

const hash = (text: string): number => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/** A small deterministic random source so a step shows the same numbers each visit. */
const rng = (seed: string) => {
  let s = hash(seed) || 1;
  return (max: number, min = 0): number => {
    s = Math.imul(s ^ (s >>> 15), 2246822519) >>> 0;
    s = Math.imul(s ^ (s >>> 13), 3266489917) >>> 0;
    return min + (((s ^ (s >>> 16)) >>> 0) % (max - min + 1));
  };
};

const TICKET_PREFIX = ["WEB", "PLAT", "OPS", "DATA", "APP"];

type Stage = "intake" | "plan" | "code" | "ci" | "review" | "deploy" | "watch";

function stageOf(step: PipelineStep): Stage | null {
  const text = `${step.id} ${step.title}`.toLowerCase();
  if (/(^|\W)ci(\W|$)|build and test|verifier|canary/.test(text)) return "ci";
  if (/review|approv|sign-?off|owner|hitl|postmortem/.test(text))
    return "review";
  if (/deploy|rollout|production|release/.test(text)) return "deploy";
  if (
    /monitor|sre|watch|performance|quarantine|alert|ingest/.test(text) &&
    !/signals/.test(text)
  )
    return "watch";
  if (/plan/.test(text)) return "plan";
  if (/coding|developer|writes|fix/.test(text)) return "code";
  if (/ticket|jira|slack|signal|builder|trigger/.test(text)) return "intake";
  return null;
}

const STAGE_ROLES: Record<Stage, string[]> = {
  intake: ["dispatcher"],
  plan: ["conductor"],
  code: ["worker"],
  ci: ["verifier"],
  review: ["verifier", "conductor"],
  deploy: ["worker", "janitor"],
  watch: ["scout", "janitor"],
};

/** The persona whose role fits a stage, picked the same way every visit. */
function profileFor(stage: Stage, seed: string): StepActivity["profile"] {
  const fits = FEED_DEMO_AGENTS.filter((a) =>
    STAGE_ROLES[stage].includes(a.role),
  );
  if (!fits.length) return null;
  const agent = fits[hash(seed) % fits.length];
  return {
    name: agent.name,
    role: agent.role,
    model: getDemoAgentRole(agent).model,
  };
}

// Teammate ids whose job fits a kind of human step, tried in order.
const HUMAN_RULES: Array<[RegExp, string[]]> = [
  [/on-call|alert|postmortem|monitor/, ["omar"]],
  [/sign-?off|jira|ticket/, ["dev"]],
  [/data owner|quarantine/, ["sofia"]],
  [/design/, ["lena"]],
  [/review|hitl|builder|slack/, ["maya", "lena"]],
];

/** The people a human step waits on; empty for a step with no person in the loop. */
function humansFor(step: PipelineStep, factoryId: string): FeedTeammate[] {
  if (step.kind !== "human") return [];
  const text = `${step.id} ${step.title}`.toLowerCase();
  const ids =
    HUMAN_RULES.find(([pattern]) => pattern.test(text))?.[1] ??
    FEED_TEAMMATES.map((m) => m.id);
  const pool = FEED_TEAMMATES.filter((m) => ids.includes(m.id));
  const first = pool[hash(`${factoryId}:${step.id}`) % pool.length];
  // Sign-offs and approvals are two-person; the second is the next teammate along.
  const second = /sign-?off|approv/.test(text)
    ? FEED_TEAMMATES[
        (FEED_TEAMMATES.indexOf(first) + 1) % FEED_TEAMMATES.length
      ]
    : null;
  return second ? [first, second] : [first];
}

/** Illustrative activity for a step, from its role in the flow. Not the factory's own data. */
export function sampleActivity(
  step: PipelineStep,
  factoryId: string,
): StepActivity | null {
  const stage = stageOf(step);
  const humans = humansFor(step, factoryId);
  if (!stage) {
    return humans.length
      ? {
          live: 0,
          queued: 0,
          blocked: 0,
          prs: [],
          tickets: [],
          agents: [],
          humans,
          profile: null,
          waitMinutes: null,
          perDay: null,
          lastMinutesAgo: null,
        }
      : null;
  }
  const r = rng(`${factoryId}:${step.id}`);
  const prefix = TICKET_PREFIX[hash(factoryId) % TICKET_PREFIX.length];
  const base = r(900, 120);
  const personas = FEED_DEMO_AGENTS.map((a) => a.name);
  const pickAgents = (n: number): string[] =>
    Array.from(
      { length: n },
      (_, i) =>
        personas[(hash(`${factoryId}${step.id}`) + i * 2) % personas.length],
    );
  const act: StepActivity = {
    live: 0,
    queued: 0,
    blocked: 0,
    prs: [],
    tickets: [],
    agents: [],
    humans,
    profile: profileFor(stage, `${factoryId}:${step.id}`),
    waitMinutes: null,
    perDay: null,
    lastMinutesAgo: r(55, 1),
  };
  switch (stage) {
    case "intake":
      act.queued = r(9, 1);
      act.tickets = Array.from(
        { length: r(3, 1) },
        (_, i) => `${prefix}-${base + i * 7}`,
      );
      act.perDay = r(14, 3);
      act.waitMinutes = r(25, 2);
      break;
    case "plan":
      act.live = r(2, 0);
      act.queued = r(4, 0);
      act.agents = pickAgents(1);
      act.waitMinutes = r(18, 3);
      break;
    case "code":
      act.live = r(4, 1);
      act.queued = r(6, 0);
      act.agents = pickAgents(Math.min(3, act.live));
      act.prs = Array.from({ length: r(3, 1) }, (_, i) => ({
        number: base + 20 + i * 3,
        state: i === 0 ? "draft" : "open",
      }));
      act.perDay = r(9, 2);
      break;
    case "ci":
      act.live = r(3, 0);
      act.queued = r(8, 0);
      act.prs = [
        { number: base + 20, state: r(3, 0) === 0 ? "failing" : "open" },
      ];
      act.waitMinutes = r(14, 2);
      break;
    case "review":
      act.blocked = r(4, 0);
      act.queued = r(5, 0);
      act.live = r(2, 0);
      act.prs = Array.from({ length: r(3, 1) }, (_, i) => ({
        number: base + 12 + i * 5,
        state: "open" as PrState,
      }));
      act.waitMinutes = r(150, 12);
      break;
    case "deploy":
      act.live = r(1, 0);
      act.prs = Array.from({ length: r(3, 1) }, (_, i) => ({
        number: base - 10 + i * 4,
        state: "merged" as PrState,
      }));
      act.perDay = r(6, 1);
      act.lastMinutesAgo = r(300, 20);
      break;
    case "watch":
      act.live = r(2, 0);
      act.blocked = r(1, 0);
      act.agents = pickAgents(1);
      act.perDay = r(30, 4);
      break;
    default:
      return null;
  }
  return act;
}

/** Activity for every step that has any. */
export function buildActivity(
  steps: PipelineStep[],
  factoryId: string,
): Record<string, StepActivity> {
  const out: Record<string, StepActivity> = {};
  steps.forEach((s) => {
    const a = sampleActivity(s, factoryId);
    if (a) out[s.id] = a;
  });
  return out;
}

export const inFlight = (a: StepActivity | undefined): number =>
  a ? a.live + a.queued + a.blocked : 0;

/** Pixels a step grows by to fit its person or profile pill and its chip row. */
export const extraHeight = (a: StepActivity | undefined): number => {
  if (!a) return 0;
  const pill = a.humans.length || a.profile ? 26 : 0;
  const chips = a.prs.length || a.tickets.length || a.agents.length ? 24 : 0;
  return pill + chips;
};

/**
 * How far down each step moves so that growing the steps above it never makes them
 * overlap: a step shifts by the growth of whatever sits over it in the same column.
 */
export function layoutShifts(
  steps: PipelineStep[],
  activity: Record<string, StepActivity> | undefined,
): Record<string, number> {
  const shifts: Record<string, number> = {};
  [...steps]
    .sort((a, b) => a.y - b.y)
    .forEach((step) => {
      shifts[step.id] = steps.reduce((deepest, above) => {
        const overlapsColumn =
          above.x < step.x + step.width && step.x < above.x + above.width;
        if (above.id === step.id || above.y >= step.y || !overlapsColumn) {
          return deepest;
        }
        const pushed =
          (shifts[above.id] ?? 0) + extraHeight(activity?.[above.id]);
        return Math.max(deepest, pushed);
      }, 0);
    });
  return shifts;
}
