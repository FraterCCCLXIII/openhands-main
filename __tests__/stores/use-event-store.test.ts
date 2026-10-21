import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  EMPTY_EVENTS,
  useEventStore,
} from "#/stores/use-event-store";
import {
  ActionEvent,
  MessageEvent,
  ObservationEvent,
  SecurityRisk,
} from "#/types/agent-server/core";
import { StreamingDeltaEvent } from "#/types/agent-server/core/events/streaming-delta-event";

const CONV_A = "conv-a";
const CONV_B = "conv-b";

const mockUserMessageEvent: MessageEvent = {
  id: "test-event-1",
  timestamp: Date.now().toString(),
  source: "user",
  llm_message: {
    role: "user",
    content: [{ type: "text", text: "Hello, world!" }],
  },
  activated_skills: [],
  extended_content: [],
};

const mockActionEvent: ActionEvent = {
  id: "test-action-1",
  timestamp: Date.now().toString(),
  source: "agent",
  thought: [{ type: "text", text: "I need to execute a bash command" }],
  thinking_blocks: [],
  action: {
    kind: "ExecuteBashAction",
    command: "echo hello",
    is_input: false,
    timeout: null,
    reset: false,
  },
  tool_name: "execute_bash",
  tool_call_id: "call_123",
  tool_call: {
    id: "call_123",
    type: "function",
    function: {
      name: "execute_bash",
      arguments: '{"command": "echo hello"}',
    },
  },
  llm_response_id: "response_123",
  security_risk: SecurityRisk.UNKNOWN,
};

const mockObservationEvent: ObservationEvent = {
  id: "test-observation-1",
  timestamp: Date.now().toString(),
  source: "environment",
  tool_name: "execute_bash",
  tool_call_id: "call_123",
  observation: {
    kind: "ExecuteBashObservation",
    content: [{ type: "text", text: "hello\n" }],
    command: "echo hello",
    exit_code: 0,
    error: false,
    timeout: false,
    metadata: {
      exit_code: 0,
      pid: 12345,
      username: "user",
      hostname: "localhost",
      working_dir: "/home/user",
      py_interpreter_path: null,
      prefix: "",
      suffix: "",
    },
  },
  action_id: "test-action-1",
};

const mockAgentMessageEvent: MessageEvent = {
  ...mockUserMessageEvent,
  id: "test-agent-message-1",
  source: "agent",
  llm_message: {
    role: "assistant",
    content: [{ type: "text", text: "partial text, finished" }],
  },
};

const makeUserMessageEvent = (id: string, timestamp: string): MessageEvent => ({
  ...mockUserMessageEvent,
  id,
  timestamp,
});

const bucket = (conversationId: string) =>
  useEventStore.getState().byConversation[conversationId];

describe("useEventStore", () => {
  beforeEach(() => {
    useEventStore.getState().clearEvents();
  });

  it("should render initial state correctly", () => {
    const { result } = renderHook(() => useEventStore());
    expect(result.current.byConversation).toEqual({});
  });

  it("should add an event to a conversation bucket", () => {
    const { result } = renderHook(() => useEventStore());

    act(() => {
      result.current.addEvent(CONV_A, mockUserMessageEvent);
    });

    expect(bucket(CONV_A)?.events).toEqual([mockUserMessageEvent]);
  });

  it("should keep conversations' event streams independent", () => {
    const { result } = renderHook(() => useEventStore());

    act(() => {
      result.current.addEvent(CONV_A, mockUserMessageEvent);
      result.current.addEvent(CONV_B, mockActionEvent);
    });

    expect(bucket(CONV_A)?.events).toEqual([mockUserMessageEvent]);
    expect(bucket(CONV_B)?.events).toEqual([mockActionEvent]);
  });

  it("should project uiEvents within a conversation bucket", () => {
    const { result } = renderHook(() => useEventStore());

    act(() => {
      result.current.addEvent(CONV_A, mockUserMessageEvent);
      result.current.addEvent(CONV_A, mockActionEvent);
      result.current.addEvent(CONV_A, mockObservationEvent);
    });

    expect(bucket(CONV_A)?.uiEvents).toEqual([
      mockUserMessageEvent,
      mockObservationEvent,
    ]);
  });

  it("should bulk-add and sort older pages into a conversation", () => {
    const { result } = renderHook(() => useEventStore());
    const newest = makeUserMessageEvent("newest", "2024-03-03T00:00:00Z");
    const middle = makeUserMessageEvent("middle", "2024-03-02T00:00:00Z");
    const oldest = makeUserMessageEvent("oldest", "2024-03-01T00:00:00Z");

    act(() => {
      result.current.addEvent(CONV_A, newest);
      result.current.addEvents(CONV_A, [oldest, middle]);
    });

    expect(bucket(CONV_A)?.events.map((event) => event.id)).toEqual([
      "oldest",
      "middle",
      "newest",
    ]);
  });

  it("should de-duplicate events by id within a conversation", () => {
    const { result } = renderHook(() => useEventStore());

    act(() => {
      result.current.addEvent(CONV_A, mockUserMessageEvent);
      result.current.addEvents(CONV_A, [mockUserMessageEvent, mockActionEvent]);
    });

    expect(bucket(CONV_A)?.events).toHaveLength(2);
  });

  it("keeps streaming slots out of the durable event log and eventIds", () => {
    const { result } = renderHook(() => useEventStore());

    act(() => {
      result.current.addEvent(CONV_A, mockUserMessageEvent);
      result.current.openStreamingSlot(CONV_A, {
        type: "item_started",
        item_id: "item-1",
      });
      for (let i = 0; i < 1000; i += 1) {
        result.current.appendStreamingDeltas(CONV_A, [
          {
            type: "delta",
            item_id: "item-1",
            attempt: 1,
            order: i,
            content: "x",
          },
        ]);
      }
    });

    // The slot renders, but `events` and `eventIds` only ever hold durable
    // records — the slot's id IS the coming message's id, so tracking it would
    // dedupe the real message away.
    expect(bucket(CONV_A)?.events).toEqual([mockUserMessageEvent]);
    expect(bucket(CONV_A)?.eventIds.size).toBe(1);
    expect(bucket(CONV_A)?.uiEvents).toHaveLength(2);
    expect(
      (bucket(CONV_A)?.uiEvents[1] as StreamingDeltaEvent).content,
    ).toHaveLength(1000);
  });

  it("retires a slot when the durable event with its id arrives", () => {
    const { result } = renderHook(() => useEventStore());

    act(() => {
      result.current.openStreamingSlot(CONV_A, {
        type: "item_started",
        item_id: mockAgentMessageEvent.id,
      });
      result.current.appendStreamingDeltas(CONV_A, [
        {
          type: "delta",
          item_id: mockAgentMessageEvent.id,
          attempt: 1,
          order: 0,
          content: "partial",
        },
      ]);
      result.current.addEvent(CONV_A, mockAgentMessageEvent);
    });

    expect(bucket(CONV_A)?.uiEvents).toEqual([mockAgentMessageEvent]);
    expect(bucket(CONV_A)?.events).toEqual([mockAgentMessageEvent]);
  });

  it("clears only the addressed socket's slots", () => {
    const { result } = renderHook(() => useEventStore());

    act(() => {
      result.current.openStreamingSlot(CONV_A, {
        type: "item_started",
        item_id: "main-item",
      });
      result.current.openStreamingSlot(
        CONV_A,
        { type: "item_started", item_id: "plan-item" },
        { isFromPlanningAgent: true },
      );
      result.current.clearStreamingSlots(CONV_A);
    });

    expect(bucket(CONV_A)?.uiEvents.map((event) => event.id)).toEqual([
      "plan-item",
    ]);

    act(() => {
      result.current.clearStreamingSlots(CONV_A, true);
    });
    expect(bucket(CONV_A)?.uiEvents).toEqual([]);
  });

  it("loadConversation creates an empty bucket and is idempotent on remount", () => {
    const { result } = renderHook(() => useEventStore());

    act(() => {
      result.current.loadConversation(CONV_A);
      result.current.addEvent(CONV_A, mockUserMessageEvent);
    });
    expect(result.current.isConversationLoaded(CONV_A)).toBe(true);
    expect(bucket(CONV_A)?.events).toHaveLength(1);

    // Remounting the same conversation must NOT wipe its events — the WS
    // provider treats an already-loaded id as a no-op.
    act(() => {
      // Simulate the provider's guard: only load when not already loaded.
      if (!result.current.isConversationLoaded(CONV_A)) {
        result.current.loadConversation(CONV_A);
      }
    });
    expect(bucket(CONV_A)?.events).toEqual([mockUserMessageEvent]);
  });

  it("clearConversation drops only the named bucket", () => {
    const { result } = renderHook(() => useEventStore());

    act(() => {
      result.current.addEvent(CONV_A, mockUserMessageEvent);
      result.current.addEvent(CONV_B, mockActionEvent);
      result.current.clearConversation(CONV_A);
    });

    expect(bucket(CONV_A)).toBeUndefined();
    expect(bucket(CONV_B)?.events).toEqual([mockActionEvent]);
  });

  it("clearEvents drops every conversation", () => {
    const { result } = renderHook(() => useEventStore());

    act(() => {
      result.current.addEvent(CONV_A, mockUserMessageEvent);
      result.current.addEvent(CONV_B, mockActionEvent);
      result.current.clearEvents();
    });

    expect(result.current.byConversation).toEqual({});
    expect(EMPTY_EVENTS).toEqual([]);
  });
});
