import type {
  ActionEvent,
  MessageEvent,
  OpenHandsEvent,
} from "#/types/agent-server/core";
import { SecurityRisk } from "#/types/agent-server/core/base/common";
import {
  getActionThoughtText,
  getReasoningContent,
} from "#/components/conversation-events/chat/event-thought-helpers";
import {
  isActionEvent,
  isConversationErrorEvent,
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
  /** The event the details belong to. */
  eventId?: string;
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
    d.skills?.length
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
): FeedUpdateDetails {
  return {
    result,
    ...reasoningDetails(event),
    thought: getActionThoughtText(event).trim() || undefined,
    risk:
      event.security_risk && event.security_risk !== SecurityRisk.UNKNOWN
        ? event.security_risk
        : undefined,
    outcome,
    eventId: event.id,
  };
}

/** Reasoning and loaded skills of an agent message. */
export function getMessageDetails(
  event: MessageEvent,
  evidence?: FeedUpdateDetails["evidence"],
): FeedUpdateDetails {
  return {
    evidence: evidence?.length ? evidence : undefined,
    ...reasoningDetails(event.llm_message),
    skills: event.activated_skills?.length ? event.activated_skills : undefined,
    eventId: event.id,
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
    const details = getActionDetails(event, outcomes.get(event.id));
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
  return events
    .map((event) => toFeedUpdate(event, max, outcomes))
    .filter((update): update is FeedUpdate => update !== null)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
