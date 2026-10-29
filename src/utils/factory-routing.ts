import type { FeedAgentRoleKey } from "./feed-agent-role";

/** Where a request sent from a factory's composer is aimed. */
export type FactoryTarget =
  /** The factory inbox: the coordinator decides where it goes. */
  | { kind: "inbox" }
  /** One agent's inbox: that agent decides among its own work. */
  | { kind: "agent"; agentName: string }
  /** One conversation, by the agent that runs it. */
  | { kind: "conversation"; conversationId: string }
  /** One pull request. */
  | { kind: "pr"; prNumber: string };

export interface RouteCandidate {
  id: string;
  title: string;
  agentName: string;
  /** Pull request numbers this conversation owns, such as "412". */
  pullRequests: string[];
  /** Ticket keys it owns, such as "ENG-42". */
  tickets: string[];
}

export interface RouteAgent {
  name: string;
  role: FeedAgentRoleKey;
}

export interface RouteContext {
  candidates: RouteCandidate[];
  agents: RouteAgent[];
  /** The agent that routes the factory inbox. */
  coordinator: RouteAgent;
}

/** Why a request went where it did; the UI turns each into a sentence. */
export type RouteReason =
  | { code: "picked" }
  | { code: "agent_named"; name: string }
  | { code: "ref"; ref: string }
  | { code: "similar"; percent: number }
  | { code: "role"; name: string }
  | { code: "no_match" };

export interface RouteDecision {
  /** An existing conversation to send to, or a new one to start. */
  kind: "existing" | "new";
  conversationId: string | null;
  /** The agent that takes the request. */
  agentName: string;
  reasons: RouteReason[];
  /** 0–1: how sure the router is. */
  confidence: number;
  /** Other conversations that also matched, best first. */
  alternatives: string[];
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "into",
  "are",
  "was",
  "can",
  "could",
  "would",
  "should",
  "please",
  "have",
  "has",
  "not",
  "you",
  "your",
  "our",
  "its",
  "any",
  "all",
  "but",
  "about",
  "when",
  "what",
  "how",
]);

const words = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3 && !STOP_WORDS.has(word)),
  );

/** Work that points at an agent role, checked in order. */
const ROLE_INTENTS: Array<[FeedAgentRoleKey, RegExp]> = [
  ["verifier", /\b(review|verify|test|tests|check|qa|audit|lint)\b/i],
  [
    "scout",
    /\b(research|find|investigate|explore|look into|why|analy[sz]e)\b/i,
  ],
  ["janitor", /\b(clean|cleanup|prune|archive|dependenc(y|ies)|bump)\b/i],
  ["conductor", /\b(plan|roadmap|prioriti[sz]e|schedule|release)\b/i],
  ["worker", /\b(fix|build|implement|add|create|write|refactor|update)\b/i],
];

const PR_REF = /(?:#|\/pull\/)(\d+)\b/g;
const TICKET_REF = /\b([A-Z][A-Z0-9]+-\d+)\b/g;
const MIN_SHARED_WORDS = 2;
const MIN_OVERLAP = 0.5;

const agentNamed = (text: string, agents: RouteAgent[]): RouteAgent | null =>
  agents.find((agent) =>
    new RegExp(`(^|[^A-Za-z0-9])@?${agent.name}\\b`, "i").test(text),
  ) ?? null;

/** The agent for new work: by intent, else a worker, else the coordinator. */
function pickAgentForNewWork(
  text: string,
  context: RouteContext,
): { agent: RouteAgent; byRole: boolean } {
  for (const [role, pattern] of ROLE_INTENTS) {
    if (!pattern.test(text)) continue;
    const agent = context.agents.find((candidate) => candidate.role === role);
    if (agent) return { agent, byRole: true };
  }
  const worker = context.agents.find((agent) => agent.role === "worker");
  return { agent: worker ?? context.coordinator, byRole: false };
}

function matchReference(
  text: string,
  candidates: RouteCandidate[],
): { candidate: RouteCandidate; ref: string } | null {
  const prs = [...text.matchAll(PR_REF)].map((match) => match[1]);
  const tickets = [...text.matchAll(TICKET_REF)].map((match) => match[1]);
  for (const pr of prs) {
    const owner = candidates.find((c) => c.pullRequests.includes(pr));
    if (owner) return { candidate: owner, ref: `#${pr}` };
  }
  for (const ticket of tickets) {
    const owner = candidates.find((c) => c.tickets.includes(ticket));
    if (owner) return { candidate: owner, ref: ticket };
  }
  return null;
}

function bestSimilar(
  text: string,
  candidates: RouteCandidate[],
): Array<{ candidate: RouteCandidate; overlap: number }> {
  const request = words(text);
  if (request.size === 0) return [];
  return candidates
    .map((candidate) => {
      const title = words(candidate.title);
      const shared = [...request].filter((word) => title.has(word)).length;
      const smaller = Math.min(request.size, title.size) || 1;
      return { candidate, shared, overlap: shared / smaller };
    })
    .filter((m) => m.shared >= MIN_SHARED_WORDS && m.overlap >= MIN_OVERLAP)
    .sort((a, b) => b.overlap - a.overlap);
}

const existing = (
  candidate: RouteCandidate,
  reasons: RouteReason[],
  confidence: number,
  alternatives: string[] = [],
): RouteDecision => ({
  kind: "existing",
  conversationId: candidate.id,
  agentName: candidate.agentName,
  reasons,
  confidence,
  alternatives,
});

/**
 * Decides where a factory request goes. An explicit target wins. Otherwise,
 * in order: a pull request or ticket the text names, an agent it names, a
 * conversation that shares most of its words, and failing all of those a new
 * conversation with the agent whose role fits the work.
 */
export function routeFactoryRequest(
  text: string,
  target: FactoryTarget,
  context: RouteContext,
): RouteDecision {
  if (target.kind === "conversation") {
    const picked = context.candidates.find(
      (c) => c.id === target.conversationId,
    );
    if (picked) return existing(picked, [{ code: "picked" }], 1);
  }
  if (target.kind === "pr") {
    const owner = context.candidates.find((c) =>
      c.pullRequests.includes(target.prNumber),
    );
    if (owner) {
      return existing(
        owner,
        [{ code: "ref", ref: `#${target.prNumber}` }],
        0.95,
      );
    }
  }

  // An agent inbox narrows the pool; the factory inbox searches everything.
  let pool = context.candidates;
  let named: RouteAgent | null = null;
  if (target.kind === "agent") {
    named = context.agents.find((a) => a.name === target.agentName) ?? null;
  } else if (target.kind === "inbox") {
    named = agentNamed(text, context.agents);
  }
  const reasons: RouteReason[] = [];
  if (named) {
    pool = pool.filter((c) => c.agentName === named?.name);
    if (target.kind === "inbox")
      reasons.push({ code: "agent_named", name: named.name });
  }

  const ref = matchReference(text, pool);
  if (ref) {
    return existing(
      ref.candidate,
      [...reasons, { code: "ref", ref: ref.ref }],
      0.9,
    );
  }

  const similar = bestSimilar(text, pool);
  if (similar.length > 0) {
    const [top, ...rest] = similar;
    return existing(
      top.candidate,
      [...reasons, { code: "similar", percent: Math.round(top.overlap * 100) }],
      Math.min(0.9, 0.5 + top.overlap * 0.4),
      rest.map((m) => m.candidate.id),
    );
  }

  if (named) {
    return {
      kind: "new",
      conversationId: null,
      agentName: named.name,
      reasons: [...reasons, { code: "no_match" }],
      confidence: 0.6,
      alternatives: [],
    };
  }
  const { agent, byRole } = pickAgentForNewWork(text, context);
  return {
    kind: "new",
    conversationId: null,
    agentName: agent.name,
    reasons: [
      { code: "no_match" },
      ...(byRole ? [{ code: "role" as const, name: agent.name }] : []),
    ],
    confidence: byRole ? 0.7 : 0.5,
    alternatives: [],
  };
}
