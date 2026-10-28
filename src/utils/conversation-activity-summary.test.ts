import { describe, expect, it } from "vitest";
import type { OHEvent } from "#/stores/use-event-store";
import { LAUNCH_CHILD_CONVERSATION_TOOL_NAME } from "#/constants/child-conversation";
import { summarizeConversationActivity } from "./conversation-activity-summary";

let nextId = 0;

function baseEvent(timestamp: string) {
  nextId += 1;
  return { id: `event-${nextId}`, timestamp, source: "agent" as const };
}

function userMessage(timestamp: string): OHEvent {
  return {
    ...baseEvent(timestamp),
    source: "user",
    llm_message: { role: "user", content: [{ type: "text", text: "hi" }] },
  } as unknown as OHEvent;
}

function agentAction(
  timestamp: string,
  action: Record<string, unknown>,
  toolName: string,
): OHEvent {
  return {
    ...baseEvent(timestamp),
    action: { kind: action.kind, ...action },
    tool_name: toolName,
    tool_call_id: `call-${nextId}`,
  } as unknown as OHEvent;
}

function compaction(timestamp: string): OHEvent {
  return {
    ...baseEvent(timestamp),
    kind: "Condensation",
  } as unknown as OHEvent;
}

describe("summarizeConversationActivity", () => {
  it("returns zeroed counts and no last-active time for an empty log", () => {
    expect(summarizeConversationActivity([])).toEqual({
      userMessages: 0,
      compactions: 0,
      lastActiveAt: null,
      commands: 0,
      filesTouched: 0,
      pagesBrowsed: 0,
      subthreads: 0,
    });
  });

  it("counts each kind of activity and reports the newest timestamp", () => {
    const events: OHEvent[] = [
      userMessage("2026-10-20T10:00:00Z"),
      agentAction(
        "2026-10-20T10:01:00Z",
        { kind: "ExecuteBashAction", command: "ls" },
        "terminal",
      ),
      agentAction(
        "2026-10-20T10:02:00Z",
        { kind: "BrowserNavigateAction", url: "https://example.com" },
        "browser_navigate",
      ),
      agentAction(
        "2026-10-20T10:03:00Z",
        { kind: "PlanningFileEditorAction", path: "/work/a.ts" },
        "file_editor",
      ),
      agentAction(
        "2026-10-20T10:04:00Z",
        { kind: "FileEditorAction", path: "/work/a.ts" },
        "file_editor",
      ),
      agentAction(
        "2026-10-20T10:05:00Z",
        { kind: "FileEditorAction", path: "/work/b.ts" },
        "file_editor",
      ),
      agentAction(
        "2026-10-20T10:06:00Z",
        { kind: "LaunchChildConversationAction" },
        LAUNCH_CHILD_CONVERSATION_TOOL_NAME,
      ),
      compaction("2026-10-20T10:07:00Z"),
    ];

    expect(summarizeConversationActivity(events)).toEqual({
      userMessages: 1,
      compactions: 1,
      lastActiveAt: "2026-10-20T10:07:00Z",
      commands: 1,
      filesTouched: 2,
      pagesBrowsed: 1,
      subthreads: 1,
    });
  });
});
