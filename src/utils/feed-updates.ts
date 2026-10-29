import type {
  ActionEvent,
  HookExecutionEvent,
  MessageEvent,
  OpenHandsEvent,
} from "#/types/agent-server/core";
import type {
  ConversationStats,
  TokenUsage,
} from "#/types/agent-server/core/events/conversation-state-event";
import { SecurityRisk } from "#/types/agent-server/core/base/common";
import {
  getActionThoughtText,
  getReasoningContent,
} from "#/components/conversation-events/chat/event-thought-helpers";
import { isCorrectiveNudge } from "#/components/conversation-events/chat/event-content-helpers/should-render-event";
import {
  isActionEvent,
  isCondensationEvent,
  isConversationErrorEvent,
  isHookExecutionEvent,
  isMessageEvent,
  isObservationEvent,
  isUserRejectObservation,
} from "#/types/agent-server/type-guards";

export type FeedUpdateKind = "user" | "agent" | "action" | "error";

/** What the agent was thinking and how a step turned out, shown behind a button. */
export interface FeedUpdateDetails {
  reasoning?: string;
  /** The provider returned thinking it does not let clients read. */
  redacted: boolean;
  thought?: string;
  /** Set when the risk analyzer scored the action. */
  risk?: SecurityRisk;
  outcome?: {
    isError: boolean;
    exitCode?: number | null;
    rejectionReason?: string;
  };
  /** Skills the agent loaded for a message. */
  skills?: string[];
  /** What the tool printed, so the conclusion can be traced to it. */
  result?: string;
  /** For a message: the tool results of the turn before it. */
  evidence?: { label: string; result: string }[];
  /** The tool the step ran. */
  tool?: string;
  /** The event the details belong to. */
  eventId?: string;
  /** What the tool was asked to do, as key and value pairs. */
  args?: { key: string; value: string }[];
  /** From the action to its observation. */
  durationMs?: number;
  /** For a message: the corrective nudge that prompted the turn. */
  promptedBy?: string;
  hooks?: HookRun[];
  /** History the condenser dropped during the turn. */
  condensations?: { dropped: number; summary?: string }[];
  /** A step that delegated to a subagent. */
  subagent?: { type: string; description?: string; status?: string };
  /** What the model call behind this step consumed. */
  usage?: StepUsage;
}

export interface HookRun {
  type: string;
  blocked: boolean;
  success: boolean;
  exitCode: number | null;
  reason?: string;
  tool?: string;
}

export interface StepUsage {
  model?: string;
  promptTokens: number;
  completionTokens: number;
  cacheReadTokens: number;
  reasoningTokens: number;
  cost: number;
  /** Tokens of context the call used, and the model's window (0 when unknown). */
  contextTokens: number;
  contextWindow: number;
}

const MAX_RESULT = 1200;

/** The text an observation showed the agent, trimmed for display. */
export function resultText(event: OpenHandsEvent): string | undefined {
  if (!isObservationEvent(event)) return undefined;
  const obs = event.observation as { content?: unknown; output?: unknown };
  let text = "";
  if (Array.isArray(obs.content)) {
    text = obs.content
      .map((part) =>
        part && typeof part === "object" && "text" in part
          ? String((part as { text: unknown }).text)
          : "",
      )
      .join("\n");
  } else if (typeof obs.output === "string") {
    text = obs.output;
  }
  text = text.trim();
  if (!text) return undefined;
  return text.length > MAX_RESULT ? `${text.slice(0, MAX_RESULT)}…` : text;
}

export interface FeedUpdate {
  id: string;
  kind: FeedUpdateKind;
  timestamp: string;
  /** Message text, or the action's summary (tool name when it has none). */
  text: string;
  details?: FeedUpdateDetails;
}

export const FEED_UPDATE_LIMIT = 6;

const MAX_UPDATE_TEXT = 280;

const truncate = (text: string, max = MAX_UPDATE_TEXT): string =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

type Reasoning = Parameters<typeof getReasoningContent>[0];

export function reasoningDetails(source: Reasoning): FeedUpdateDetails {
  return {
    reasoning: getReasoningContent(source).trim() || undefined,
    redacted: !!source.thinking_blocks?.some(
      (b) => b.type === "redacted_thinking",
    ),
  };
}

const hasDetails = (d: FeedUpdateDetails): boolean =>
  !!(
    d.reasoning ||
    d.redacted ||
    d.thought ||
    d.risk ||
    d.outcome ||
    d.result ||
    d.skills?.length ||
    d.args?.length ||
    d.durationMs !== undefined ||
    d.promptedBy ||
    d.hooks?.length ||
    d.condensations?.length ||
    d.subagent ||
    d.usage
  );

/** The outcome an observation reports for the action it answers. */
export function outcomeOf(
  event: OpenHandsEvent,
): FeedUpdateDetails["outcome"] | undefined {
  if (isUserRejectObservation(event)) {
    return { isError: true, rejectionReason: event.rejection_reason };
  }
  if (!isObservationEvent(event)) return undefined;
  const obs = event.observation as {
    is_error?: boolean;
    error?: boolean;
    exit_code?: number | null;
  };
  return { isError: !!(obs.is_error ?? obs.error), exitCode: obs.exit_code };
}

/** Reasoning, thought, risk and outcome of one action. */
export function getActionDetails(
  event: ActionEvent,
  outcome?: FeedUpdateDetails["outcome"],
  result?: string,
  context: Partial<FeedUpdateDetails> = {},
): FeedUpdateDetails {
  return {
    result,
    ...context,
    ...reasoningDetails(event),
    thought: getActionThoughtText(event).trim() || undefined,
    risk:
      event.security_risk && event.security_risk !== SecurityRisk.UNKNOWN
        ? event.security_risk
        : undefined,
    outcome,
    tool: event.tool_name || undefined,
    eventId: event.id,
  };
}

/** Reasoning and loaded skills of an agent message. */
export function getMessageDetails(
  event: MessageEvent,
  evidence?: FeedUpdateDetails["evidence"],
  context: Partial<FeedUpdateDetails> = {},
): FeedUpdateDetails {
  return {
    ...context,
    evidence: evidence?.length ? evidence : undefined,
    ...reasoningDetails(event.llm_message),
    skills: event.activated_skills?.length ? event.activated_skills : undefined,
    eventId: event.id,
  };
}

const MAX_ARG_VALUE = 400;
const MAX_ARGS = 8;
const MAX_HOOKS = 8;
/** Args shown elsewhere, or noise. */
const HIDDEN_ARGS = new Set(["kind", "security_risk", "summary"]);

/** The tool call's arguments, compactly, for display. */
export function actionArguments(
  event: ActionEvent,
): FeedUpdateDetails["args"] | undefined {
  const action = event.action as unknown as Record<string, unknown>;
  const hidden = new Set(HIDDEN_ARGS);
  if (action.kind === "TaskAction") {
    hidden.add("subagent_type");
    hidden.add("description");
  }
  const args = Object.entries(action)
    .filter(
      ([key, value]) =>
        !hidden.has(key) &&
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== false,
    )
    .slice(0, MAX_ARGS)
    .map(([key, value]) => ({
      key,
      value: truncate(
        typeof value === "string" ? value : JSON.stringify(value),
        MAX_ARG_VALUE,
      ),
    }));
  return args.length ? args : undefined;
}

/** Event timestamps may omit the offset; treat those as UTC. */
function eventTime(timestamp?: string): number | null {
  if (!timestamp) return null;
  const utc = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp)
    ? timestamp
    : `${timestamp}Z`;
  const time = new Date(utc).getTime();
  return Number.isNaN(time) ? null : time;
}

export function stepDurationMs(
  action: OpenHandsEvent,
  observation?: OpenHandsEvent,
): number | undefined {
  const start = eventTime(action.timestamp);
  const end = eventTime(observation?.timestamp);
  return start !== null && end !== null && end >= start
    ? end - start
    : undefined;
}

/** The subagent a TaskAction handed work to, and how it ended. */
export function subagentOf(
  action: ActionEvent,
  observation?: OpenHandsEvent,
): FeedUpdateDetails["subagent"] | undefined {
  const task = action.action as unknown as {
    kind?: string;
    subagent_type?: string;
    description?: string | null;
  };
  if (task.kind !== "TaskAction" || !task.subagent_type) return undefined;
  const obs =
    observation && isObservationEvent(observation)
      ? (observation.observation as { status?: string })
      : undefined;
  return {
    type: task.subagent_type,
    description: task.description?.trim() || undefined,
    status: obs?.status,
  };
}

export function hookRunOf(event: HookExecutionEvent): HookRun {
  return {
    type: event.hook_event_type,
    blocked: event.blocked,
    success: event.success,
    exitCode: event.exit_code,
    reason: event.reason?.trim() || undefined,
    tool: event.tool_name ?? undefined,
  };
}

/** Per-call token usage cannot be read from the stream; snapshots can. */
function statsOf(event: OpenHandsEvent): ConversationStats | undefined {
  if (!("key" in event) || event.key !== "stats") return undefined;
  const value = event.value as ConversationStats | undefined;
  return value?.usage_to_metrics ? value : undefined;
}

const sum = (a: TokenUsage | null | undefined, b?: TokenUsage | null) => ({
  prompt: (a?.prompt_tokens ?? 0) - (b?.prompt_tokens ?? 0),
  completion: (a?.completion_tokens ?? 0) - (b?.completion_tokens ?? 0),
  cacheRead: (a?.cache_read_tokens ?? 0) - (b?.cache_read_tokens ?? 0),
  reasoning: (a?.reasoning_tokens ?? 0) - (b?.reasoning_tokens ?? 0),
});

/** What changed between two accumulated stats snapshots. */
export function statsDelta(
  current: ConversationStats,
  previous?: ConversationStats,
): StepUsage | undefined {
  const total: StepUsage = {
    promptTokens: 0,
    completionTokens: 0,
    cacheReadTokens: 0,
    reasoningTokens: 0,
    cost: 0,
    contextTokens: 0,
    contextWindow: 0,
  };
  let biggest = -1;
  Object.entries(current.usage_to_metrics).forEach(([id, metrics]) => {
    const before = previous?.usage_to_metrics?.[id];
    const delta = sum(
      metrics.accumulated_token_usage,
      before?.accumulated_token_usage,
    );
    total.promptTokens += delta.prompt;
    total.completionTokens += delta.completion;
    total.cacheReadTokens += delta.cacheRead;
    total.reasoningTokens += delta.reasoning;
    total.cost += metrics.accumulated_cost - (before?.accumulated_cost ?? 0);
    if (delta.prompt > biggest) {
      biggest = delta.prompt;
      total.model =
        metrics.accumulated_token_usage?.model || metrics.model_name;
      total.contextTokens =
        metrics.accumulated_token_usage?.per_turn_token ?? 0;
      total.contextWindow =
        metrics.accumulated_token_usage?.context_window ?? 0;
    }
  });
  return total.promptTokens + total.completionTokens > 0 ? total : undefined;
}

/**
 * The model call behind the event at `index`. The server emits one stats
 * snapshot just before each action or message it produced, so the change from
 * the snapshot before that one is what the call used. (The per-call arrays in
 * stats are not streamed, so this is the only join available client-side.)
 */
export function stepUsage(
  events: OpenHandsEvent[],
  index: number,
): StepUsage | undefined {
  const own = events[index];
  let current = -1;
  for (let i = index - 1; i >= 0; i -= 1) {
    const e = events[i];
    if (statsOf(e)) {
      current = i;
      break;
    }
    const sameResponse =
      isActionEvent(e) &&
      isActionEvent(own) &&
      e.llm_response_id === own.llm_response_id;
    if (
      !sameResponse &&
      (isActionEvent(e) || isObservationEvent(e) || isMessageEvent(e))
    ) {
      return undefined;
    }
  }
  if (current < 0) return undefined;
  const now = statsOf(events[current]) as ConversationStats;
  let before: ConversationStats | undefined;
  for (let i = current - 1; i >= 0 && !before; i -= 1) {
    before = statsOf(events[i]);
  }
  return statsDelta(now, before);
}

/** Lookups that pair actions with what happened around them. */
export interface StepIndex {
  position: Map<string, number>;
  answer: Map<string, OpenHandsEvent>;
  hooks: Map<string, HookRun[]>;
}

export function indexSteps(events: OpenHandsEvent[]): StepIndex {
  const index: StepIndex = {
    position: new Map(),
    answer: new Map(),
    hooks: new Map(),
  };
  events.forEach((event, i) => {
    if (event.id) index.position.set(event.id, i);
    if ("action_id" in event && typeof event.action_id === "string") {
      if (isHookExecutionEvent(event)) {
        const runs = index.hooks.get(event.action_id) ?? [];
        runs.push(hookRunOf(event));
        index.hooks.set(event.action_id, runs);
      } else if (outcomeOf(event)) {
        index.answer.set(event.action_id, event);
      }
    }
  });
  return index;
}

/** Arguments, timing, delegation, hooks and model usage of one action. */
export function getStepContext(
  events: OpenHandsEvent[],
  index: StepIndex,
  action: ActionEvent,
): Partial<FeedUpdateDetails> {
  const answer = index.answer.get(action.id);
  const position = index.position.get(action.id);
  return {
    args: actionArguments(action),
    durationMs: stepDurationMs(action, answer),
    subagent: subagentOf(action, answer),
    hooks: index.hooks.get(action.id)?.slice(0, MAX_HOOKS),
    usage: position === undefined ? undefined : stepUsage(events, position),
  };
}

/**
 * What surrounded an agent message since the person's last message: the
 * corrective nudge that prompted it, hook runs, condensations, and the model
 * call that wrote it.
 */
export function getTurnContext(
  events: OpenHandsEvent[],
  messageId: string,
): Partial<FeedUpdateDetails> {
  const end = events.findIndex((e) => e.id === messageId);
  if (end < 0) return {};
  const context: Partial<FeedUpdateDetails> = {};
  const hooks: HookRun[] = [];
  const condensations: NonNullable<FeedUpdateDetails["condensations"]> = [];
  for (let i = end - 1; i >= 0; i -= 1) {
    const e = events[i];
    if (isMessageEvent(e)) {
      if (e.source === "user" && !isCorrectiveNudge(e)) break;
      if (isCorrectiveNudge(e) && !context.promptedBy) {
        context.promptedBy = e.llm_message.content
          .map((part) => (part.type === "text" ? part.text : ""))
          .join(" ")
          .trim();
      }
    } else if (isHookExecutionEvent(e)) {
      hooks.unshift(hookRunOf(e));
    } else if (isCondensationEvent(e)) {
      condensations.unshift({
        dropped: e.forgotten_event_ids.length,
        summary: e.summary?.trim() || undefined,
      });
    }
  }
  return {
    ...context,
    hooks: hooks.length ? hooks.slice(-MAX_HOOKS) : undefined,
    condensations: condensations.length ? condensations : undefined,
    usage: stepUsage(events, end),
  };
}

/** Pairs each action with the observation that answered it. */
function indexOutcomes(
  events: OpenHandsEvent[],
): Map<string, NonNullable<FeedUpdateDetails["outcome"]>> {
  const outcomes = new Map<string, NonNullable<FeedUpdateDetails["outcome"]>>();
  events.forEach((event) => {
    const outcome = outcomeOf(event);
    if (outcome && "action_id" in event) {
      outcomes.set(event.action_id as string, outcome);
    }
  });
  return outcomes;
}

function toFeedUpdate(
  event: OpenHandsEvent,
  max = MAX_UPDATE_TEXT,
  outcomes: ReturnType<typeof indexOutcomes> = new Map(),
  context?: (action: ActionEvent) => Partial<FeedUpdateDetails>,
): FeedUpdate | null {
  if (isMessageEvent(event)) {
    const text = event.llm_message.content
      .map((part) => (part.type === "text" ? part.text : ""))
      .join(" ")
      .trim();
    if (!text) return null;
    const isUser = event.llm_message.role === "user";
    const details = isUser ? null : reasoningDetails(event.llm_message);
    return {
      id: event.id,
      kind: isUser ? "user" : "agent",
      timestamp: event.timestamp,
      text: truncate(text, max),
      ...(details && hasDetails(details) ? { details } : {}),
    };
  }
  if (isActionEvent(event)) {
    const details = getActionDetails(
      event,
      outcomes.get(event.id),
      undefined,
      context?.(event),
    );
    return {
      id: event.id,
      kind: "action",
      timestamp: event.timestamp,
      text: event.summary?.trim() || event.tool_name,
      ...(hasDetails(details) ? { details } : {}),
    };
  }
  if (isConversationErrorEvent(event)) {
    if (!event.id || !event.timestamp) return null;
    return {
      id: event.id,
      kind: "error",
      timestamp: event.timestamp,
      text: truncate(event.detail ?? event.code ?? "", max),
    };
  }
  return null;
}

/**
 * Reduces raw conversation events to the few that read well in a feed card:
 * user and agent messages, tool calls, and conversation errors. Returns them
 * newest first.
 */
export function toFeedUpdates(
  events: OpenHandsEvent[],
  { fullText = false }: { fullText?: boolean } = {},
): FeedUpdate[] {
  const max = fullText ? Number.POSITIVE_INFINITY : MAX_UPDATE_TEXT;
  const outcomes = indexOutcomes(events);
  const steps = indexSteps(events);
  const context = (action: ActionEvent) =>
    getStepContext(events, steps, action);
  return events
    .map((event) => toFeedUpdate(event, max, outcomes, context))
    .filter((update): update is FeedUpdate => update !== null)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
