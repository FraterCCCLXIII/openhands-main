import type { MessageEvent, OpenHandsEvent } from "#/types/agent-server/core";
import { buildConversationMinimapSegments } from "#/components/features/chat/conversation-minimap/build-conversation-minimap-segments";

export const MINIMAP_DEMO_CONVERSATION_ID = "minimap-demo";
export const MINIMAP_DEMO_TURN_COUNT = 55;

const MINIMAP_DEMO_BASE_TIME = Date.UTC(2026, 7, 20, 9, 0, 0);

const USER_PROMPTS = [
  "Summarize the latest deployment status.",
  "What changed in the auth module?",
  "Can you refactor this helper for clarity?",
  "Add tests for the pagination hook.",
  "Explain the websocket reconnect logic.",
  "Find regressions in the sidebar layout.",
  "Draft release notes for the minimap feature.",
  "Review error handling in the event store.",
  "Optimize bundle size for the chat route.",
  "Check i18n coverage for new strings.",
];

function timestampForTurn(turnIndex: number, offsetSeconds: number): string {
  return new Date(
    MINIMAP_DEMO_BASE_TIME + turnIndex * 120_000 + offsetSeconds * 1000,
  ).toISOString();
}

function createMessageEvent(
  id: string,
  role: "user" | "assistant",
  text: string,
  turnIndex: number,
  offsetSeconds: number,
): MessageEvent {
  return {
    id,
    timestamp: timestampForTurn(turnIndex, offsetSeconds),
    source: role === "user" ? "user" : "agent",
    llm_message: {
      role,
      content: [{ type: "text", text }],
    },
    activated_skills: [],
    extended_content: [],
  };
}

function userPromptForTurn(turn: number): string {
  const template = USER_PROMPTS[(turn - 1) % USER_PROMPTS.length];
  return `Turn ${turn}: ${template}`;
}

/** Vary agent reply length so minimap bar widths differ turn to turn. */
function agentReplyForTurn(turn: number): string {
  const length = 48 + (turn % 9) * 95 + ((turn * 7) % 5) * 220;
  const lead = `Agent reply for turn ${turn}. `;
  const body =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(
      Math.ceil(length / 57),
    );
  return (lead + body).slice(0, length);
}

function buildMinimapDemoEvents(turnCount: number): OpenHandsEvent[] {
  const events: OpenHandsEvent[] = [];

  for (let turn = 1; turn <= turnCount; turn += 1) {
    events.push(
      createMessageEvent(
        `minimap-demo-user-${turn}`,
        "user",
        userPromptForTurn(turn),
        turn,
        0,
      ),
      createMessageEvent(
        `minimap-demo-agent-${turn}`,
        "assistant",
        agentReplyForTurn(turn),
        turn,
        1,
      ),
    );
  }

  return events;
}

export const MINIMAP_DEMO_EVENTS: OpenHandsEvent[] = buildMinimapDemoEvents(
  MINIMAP_DEMO_TURN_COUNT,
);

/** Sanity check used by tests — minimap segments match user turns. */
export function getMinimapDemoSegmentCount(): number {
  return buildConversationMinimapSegments(MINIMAP_DEMO_EVENTS).length;
}
