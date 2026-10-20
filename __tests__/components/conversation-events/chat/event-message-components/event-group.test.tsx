import { describe, it, expect, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "test-utils";
import useMetricsStore from "#/stores/metrics-store";
import { EventGroup } from "#/components/conversation-events/chat/event-message-components/event-group";
import {
  ActionEvent,
  AgentErrorEvent,
  ObservationEvent,
  SecurityRisk,
  UserRejectObservation,
} from "#/types/agent-server/core";
import {
  ExecuteBashAction,
  FileEditorAction,
} from "#/types/agent-server/core/base/action";
import { ExecuteBashObservation } from "#/types/agent-server/core/base/observation";

const makeBashAction = (
  id: string,
  command: string,
): ActionEvent<ExecuteBashAction> => ({
  id,
  timestamp: new Date().toISOString(),
  source: "agent",
  thought: [],
  thinking_blocks: [],
  action: {
    kind: "ExecuteBashAction",
    command,
    is_input: false,
    timeout: null,
    reset: false,
  },
  tool_name: "execute_bash",
  tool_call_id: `call_${id}`,
  tool_call: {
    id: `call_${id}`,
    type: "function",
    function: {
      name: "execute_bash",
      arguments: JSON.stringify({ command }),
    },
  },
  llm_response_id: `response_${id}`,
  security_risk: SecurityRisk.UNKNOWN,
});

const makeBashObservation = (
  id: string,
  actionId: string,
  command: string,
): ObservationEvent<ExecuteBashObservation> => ({
  id,
  timestamp: new Date().toISOString(),
  source: "environment",
  tool_name: "execute_bash",
  tool_call_id: `call_${actionId}`,
  action_id: actionId,
  observation: {
    kind: "ExecuteBashObservation",
    content: [{ type: "text", text: "ok" }],
    command,
    exit_code: 0,
    error: false,
    timeout: false,
    metadata: {} as never,
  },
});

const makeUserRejectObservation = (
  id: string,
  actionId: string,
): UserRejectObservation => ({
  id,
  timestamp: new Date().toISOString(),
  source: "environment",
  tool_name: "execute_bash",
  tool_call_id: `call_${actionId}`,
  action_id: actionId,
  rejection_reason: "User rejected the action",
});

const makeAgentErrorEvent = (
  id: string,
  actionId: string,
): AgentErrorEvent => ({
  id,
  timestamp: new Date().toISOString(),
  kind: "AgentErrorEvent",
  source: "agent",
  tool_name: "execute_bash",
  tool_call_id: `call_${actionId}`,
  error: "boom",
});

describe("EventGroup", () => {
  it("returns null for an empty events array", () => {
    const { container } = renderWithProviders(
      <EventGroup events={[]}>
        <div>child</div>
      </EventGroup>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a 'completed' summary when all events are observations", () => {
    const events = [
      makeBashObservation("o1", "a1", "ls"),
      makeBashObservation("o2", "a2", "pwd"),
      makeBashObservation("o3", "a3", "whoami"),
    ];

    renderWithProviders(
      <EventGroup events={events}>
        <div data-testid="child">child content</div>
      </EventGroup>,
    );

    expect(
      screen.getByText("EVENT_GROUP$ACTIONS_COMPLETED"),
    ).toBeInTheDocument();
    // Children should not be visible in the collapsed state.
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("renders a progress summary and the running action title while in flight", () => {
    const events = [
      makeBashObservation("o1", "a1", "ls"),
      makeBashObservation("o2", "a2", "pwd"),
      // Last action has NOT been replaced by an observation -> still running.
      makeBashAction("a3", "echo hello"),
    ];

    renderWithProviders(
      <EventGroup events={events}>
        <div>child</div>
      </EventGroup>,
    );

    expect(
      screen.getByText("EVENT_GROUP$ACTIONS_PROGRESS"),
    ).toBeInTheDocument();
    // The running action's title is rendered next to the summary. Translations
    // aren't loaded in tests, so we just verify the action's translation key
    // shows up (the localized version would interpolate the command).
    expect(screen.getByText(/ACTION_MESSAGE\$RUN/)).toBeInTheDocument();
  });

  it("keeps showing the latest completed action's title while the group is still the live tail", () => {
    // All observations -> nothing in flight, but the group has not been
    // "moved past" yet, so we expect the latest observation's title to keep
    // showing as the prominent summary alongside the completed count.
    const events = [
      makeBashObservation("o1", "a1", "ls"),
      makeBashObservation("o2", "a2", "pwd"),
      makeBashObservation("o3", "a3", "whoami"),
    ];

    renderWithProviders(
      <EventGroup events={events}>
        <div>child</div>
      </EventGroup>,
    );

    // Latest observation's title is still in the summary line.
    expect(screen.getByText(/OBSERVATION_MESSAGE\$RUN/)).toBeInTheDocument();
    // ...next to the completed count.
    expect(
      screen.getByText("EVENT_GROUP$ACTIONS_COMPLETED"),
    ).toBeInTheDocument();
  });

  it("hides the latest action title once the group is finalized", () => {
    const events = [
      makeBashObservation("o1", "a1", "ls"),
      makeBashObservation("o2", "a2", "pwd"),
      makeBashObservation("o3", "a3", "whoami"),
    ];

    renderWithProviders(
      <EventGroup events={events} isFinalized>
        <div>child</div>
      </EventGroup>,
    );

    expect(
      screen.getByText("EVENT_GROUP$ACTIONS_COMPLETED"),
    ).toBeInTheDocument();
    // Once moved past, we collapse to just the count — the per-action title
    // and the success check both go away.
    expect(
      screen.queryByText(/OBSERVATION_MESSAGE\$RUN/),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("status-icon")).not.toBeInTheDocument();
  });

  it("shows a spinner while running and no status icon when done", () => {
    const running = [
      makeBashObservation("o1", "a1", "ls"),
      makeBashAction("a2", "pwd"),
    ];

    const { rerender } = renderWithProviders(
      <EventGroup events={running}>
        <div>child</div>
      </EventGroup>,
    );
    expect(screen.getByTestId("spinner-icon")).toBeInTheDocument();
    expect(screen.queryByTestId("status-icon")).not.toBeInTheDocument();

    const done = [
      makeBashObservation("o1", "a1", "ls"),
      makeBashObservation("o2", "a2", "pwd"),
    ];
    rerender(
      <EventGroup events={done}>
        <div>child</div>
      </EventGroup>,
    );
    expect(screen.queryByTestId("spinner-icon")).not.toBeInTheDocument();
    expect(screen.queryByTestId("status-icon")).not.toBeInTheDocument();
  });

  it("titles a settled group after its rejected action", () => {
    const events = [
      makeBashObservation("o1", "a1", "ls"),
      makeUserRejectObservation("r2", "a2"),
    ];
    const allEvents = [makeBashAction("a2", "pwd"), ...events];

    renderWithProviders(
      <EventGroup events={events} allEvents={allEvents}>
        <div>child</div>
      </EventGroup>,
    );

    expect(screen.getByText(/ACTION_MESSAGE\$RUN/)).toBeInTheDocument();
    expect(
      screen.getByText("EVENT_GROUP$ACTIONS_COMPLETED"),
    ).toBeInTheDocument();
  });

  it("counts an action resolved by an AgentErrorEvent as resolved instead of running", () => {
    const events = [
      makeBashObservation("o1", "a1", "ls"),
      makeBashAction("a2", "pwd"),
    ];
    const allEvents = [...events, makeAgentErrorEvent("e2", "a2")];

    renderWithProviders(
      <EventGroup events={events} allEvents={allEvents}>
        <div>child</div>
      </EventGroup>,
    );

    expect(screen.queryByTestId("spinner-icon")).not.toBeInTheDocument();
    expect(
      screen.getByText("EVENT_GROUP$ACTIONS_COMPLETED"),
    ).toBeInTheDocument();
  });

  it("updates accessibility state while toggling the group", async () => {
    const events = [
      makeBashObservation("o1", "a1", "ls"),
      makeBashObservation("o2", "a2", "pwd"),
      makeBashObservation("o3", "a3", "whoami"),
    ];
    const user = userEvent.setup();

    renderWithProviders(
      <EventGroup events={events}>
        <div data-testid="child">child content</div>
      </EventGroup>,
    );

    const toggle = screen.getByTestId("event-group-toggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-label", "EVENT_GROUP$EXPAND");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();

    await user.click(toggle);

    const content = screen.getByRole("region");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-label", "EVENT_GROUP$COLLAPSE");
    expect(toggle).toHaveAttribute("aria-controls", content.id);
    expect(content).toHaveAttribute("aria-labelledby", toggle.id);
    expect(screen.getByTestId("child")).toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-label", "EVENT_GROUP$EXPAND");
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByTestId("child")).not.toBeInTheDocument();
  });

  it("keeps grouped file-action titles non-interactive inside the toggle", () => {
    const fileAction: ActionEvent<FileEditorAction> = {
      id: "a-file",
      timestamp: new Date().toISOString(),
      source: "agent",
      thought: [],
      thinking_blocks: [],
      action: {
        kind: "FileEditorAction",
        command: "str_replace",
        path: "src/app.ts",
        file_text: null,
        old_str: "a",
        new_str: "b",
        insert_line: null,
        view_range: null,
      },
      tool_name: "file_editor",
      tool_call_id: "call_a-file",
      tool_call: {
        id: "call_a-file",
        type: "function",
        function: {
          name: "file_editor",
          arguments: JSON.stringify({
            command: "str_replace",
            path: "src/app.ts",
          }),
        },
      },
      llm_response_id: "response_a-file",
      security_risk: SecurityRisk.UNKNOWN,
    };

    renderWithProviders(
      <EventGroup events={[fileAction]}>
        <div>child</div>
      </EventGroup>,
    );

    const toggle = screen.getByTestId("event-group-toggle");
    expect(
      toggle.querySelector('[data-testid="path-component-link"]'),
    ).toBeNull();
    expect(toggle.querySelectorAll("button")).toHaveLength(0);
  });

  describe("rail variant", () => {
    it("opens itself while the group is the live tail with an action in flight", () => {
      const events = [
        makeBashObservation("o1", "a1", "ls"),
        makeBashAction("a2", "echo hello"),
      ];

      renderWithProviders(
        <EventGroup events={events} variant="rail">
          <div>child</div>
        </EventGroup>,
      );

      expect(screen.getByTestId("event-group-toggle")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      expect(screen.getByText("child")).toBeInTheDocument();
      expect(screen.getByTestId("rail-marker")).toHaveAttribute(
        "data-running",
        "true",
      );
    });

    it("stays collapsed once the group is finalized", () => {
      const events = [
        makeBashAction("a1", "echo hello"),
        makeBashObservation("o1", "a1", "hello"),
      ];

      renderWithProviders(
        <EventGroup events={events} variant="rail" isFinalized>
          <div>child</div>
        </EventGroup>,
      );

      expect(screen.getByTestId("event-group-toggle")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      expect(screen.getByTestId("event-group-content")).toHaveAttribute(
        "inert",
      );
    });

    it("respects a reader's manual toggle over the auto-open rule", async () => {
      const user = userEvent.setup();
      const events = [makeBashAction("a1", "echo hello")];

      renderWithProviders(
        <EventGroup events={events} variant="rail">
          <div>child</div>
        </EventGroup>,
      );

      const toggle = screen.getByTestId("event-group-toggle");
      expect(toggle).toHaveAttribute("aria-expanded", "true");

      await user.click(toggle);

      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(screen.getByTestId("event-group-content")).toHaveAttribute(
        "inert",
      );
    });

    it("shows skeleton rows only while the live tail is still running", () => {
      const running = [makeBashAction("a1", "echo hello")];
      const done = [
        makeBashAction("a2", "ls"),
        makeBashObservation("o2", "a2", "ls"),
      ];

      const { unmount } = renderWithProviders(
        <EventGroup events={running} variant="rail">
          <div>child</div>
        </EventGroup>,
      );
      expect(screen.getByTestId("rail-skeleton")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      unmount();

      renderWithProviders(
        <EventGroup events={done} variant="rail" isFinalized>
          <div>child</div>
        </EventGroup>,
      );
      expect(screen.queryByTestId("rail-skeleton")).not.toBeInTheDocument();
    });

    describe("token meter", () => {
      afterEach(() => useMetricsStore.getState().resetMetrics());

      const setUsage = (per_turn_token: number, context_window: number) =>
        useMetricsStore.getState().setMetrics({
          cost: null,
          max_budget_per_task: null,
          usage: {
            prompt_tokens: 0,
            completion_tokens: 0,
            cache_read_tokens: 0,
            cache_write_tokens: 0,
            context_window,
            per_turn_token,
          },
        });

      it("shows a compact count and a bar clamped to the context window", () => {
        setUsage(250000, 200000);

        renderWithProviders(
          <EventGroup events={[makeBashAction("a1", "ls")]} variant="rail">
            <div>child</div>
          </EventGroup>,
        );

        const meter = screen.getByTestId("token-meter");
        expect(meter).toHaveAttribute("title", "CONVERSATION$TOKEN_USAGE");
        expect(meter).toHaveTextContent("250K");
        expect(screen.getByTestId("token-meter-fill")).toHaveStyle({
          width: "100%",
        });
      });

      it("is hidden once finalized or without a context window", () => {
        setUsage(1200, 0);
        const events = [makeBashAction("a1", "ls")];
        const { unmount } = renderWithProviders(
          <EventGroup events={events} variant="rail">
            <div>child</div>
          </EventGroup>,
        );
        expect(screen.queryByTestId("token-meter")).not.toBeInTheDocument();
        unmount();

        setUsage(1200, 8000);
        renderWithProviders(
          <EventGroup events={events} variant="rail" isFinalized>
            <div>child</div>
          </EventGroup>,
        );
        expect(screen.queryByTestId("token-meter")).not.toBeInTheDocument();
      });
    });

    it("keeps the classic variant collapsed while running", () => {
      const events = [makeBashAction("a1", "echo hello")];

      renderWithProviders(
        <EventGroup events={events}>
          <div>child</div>
        </EventGroup>,
      );

      expect(screen.getByTestId("event-group-toggle")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
      expect(screen.queryByTestId("rail-marker")).not.toBeInTheDocument();
    });
  });
});
