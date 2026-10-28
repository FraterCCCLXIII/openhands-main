import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "test-utils";
import { ThoughtScratch } from "#/components/conversation-events/chat/event-message-components/thought-scratch";
import { ActionEvent, SecurityRisk } from "#/types/agent-server/core";
import { ExecuteBashAction } from "#/types/agent-server/core/base/action";

const makeAction = (
  thought: ActionEvent<ExecuteBashAction>["thought"],
): ActionEvent<ExecuteBashAction> => ({
  id: "a1",
  timestamp: new Date().toISOString(),
  source: "agent",
  thought,
  thinking_blocks: [],
  action: {
    kind: "ExecuteBashAction",
    command: "ls",
    is_input: false,
    timeout: null,
    reset: false,
  },
  tool_name: "execute_bash",
  tool_call_id: "call_a1",
  tool_call: {
    id: "call_a1",
    type: "function",
    function: { name: "execute_bash", arguments: "{}" },
  },
  llm_response_id: "response_a1",
  security_risk: SecurityRisk.UNKNOWN,
});

describe("ThoughtScratch", () => {
  it("shows the agent's text thought as muted scratch", () => {
    renderWithProviders(
      <ThoughtScratch
        event={makeAction([
          { type: "text", text: "Checking the directory first." },
        ])}
      />,
    );

    expect(screen.getByTestId("thought-scratch")).toHaveTextContent(
      "Checking the directory first.",
    );
  });

  it("joins multiple text parts and ignores non-text parts", () => {
    renderWithProviders(
      <ThoughtScratch
        event={makeAction([
          { type: "text", text: "First." },
          { type: "image", image_urls: [] } as never,
          { type: "text", text: "Second." },
        ])}
      />,
    );

    expect(screen.getByTestId("thought-scratch")).toHaveTextContent(
      /First\.\s*Second\./,
    );
  });

  it("renders nothing when the thought is blank", () => {
    const { container } = renderWithProviders(
      <ThoughtScratch event={makeAction([{ type: "text", text: "   " }])} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
