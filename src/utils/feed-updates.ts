import type { OpenHandsEvent } from "#/types/agent-server/core";
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

function reasoningDetails(source: Reasoning): FeedUpdateDetails {
  return {
    reasoning: getReasoningContent(source).trim() || undefined,
    redacted: !!source.thinking_blocks?.some(
      (b) => b.type === "redacted_thinking",
    ),
  };
}

const hasDetails = (d: FeedUpdateDetails): boolean =>
  !!(d.reasoning || d.redacted || d.thought || d.risk || d.outcome);

/** Pairs each action with the observation that answered it. */
function indexOutcomes(
  events: OpenHandsEvent[],
): Map<string, NonNullable<FeedUpdateDetails["outcome"]>> {
  const outcomes = new Map<string, NonNullable<FeedUpdateDetails["outcome"]>>();
  events.forEach((event) => {
    if (isUserRejectObservation(event)) {
      outcomes.set(event.action_id, {
        isError: true,
        rejectionReason: event.rejection_reason,
      });
    } else if (isObservationEvent(event)) {
      const obs = event.observation as {
        is_error?: boolean;
        error?: boolean;
        exit_code?: number | null;
      };
      outcomes.set(event.action_id, {
        isError: !!(obs.is_error ?? obs.error),
        exitCode: obs.exit_code,
      });
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
    const details: FeedUpdateDetails = {
      ...reasoningDetails(event),
      thought: getActionThoughtText(event).trim() || undefined,
      risk:
        event.security_risk && event.security_risk !== SecurityRisk.UNKNOWN
          ? event.security_risk
          : undefined,
      outcome: outcomes.get(event.id),
    };
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
