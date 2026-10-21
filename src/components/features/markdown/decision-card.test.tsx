import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { parseDecisionCard, DecisionCard } from "./decision-card";

const sendMessage = vi.fn().mockResolvedValue({ queued: false });

vi.mock("#/contexts/conversation-websocket-context", () => ({
  useConversationWebSocket: () => ({ sendMessage }),
}));

const VALID_CARD = JSON.stringify({
  question: "Should session open rebase via a SessionStart hook?",
  options: [
    { label: "SessionStart hook", description: "Runs on every new session" },
    { label: "git pull.rebase" },
  ],
  recommended: 0,
});

describe("parseDecisionCard", () => {
  it("returns the question, options, and recommended index for a valid card", () => {
    expect(parseDecisionCard(VALID_CARD)).toEqual({
      question: "Should session open rebase via a SessionStart hook?",
      options: [
        {
          label: "SessionStart hook",
          description: "Runs on every new session",
        },
        { label: "git pull.rebase", description: undefined },
      ],
      recommended: 0,
    });
  });

  it.each([
    ["not JSON", "question: yes"],
    [
      "a missing question",
      JSON.stringify({ options: [{ label: "a" }, { label: "b" }] }),
    ],
    [
      "fewer than two options",
      JSON.stringify({ question: "q", options: [{ label: "a" }] }),
    ],
    [
      "an option without a label",
      JSON.stringify({
        question: "q",
        options: [{ label: "a" }, { description: "b" }],
      }),
    ],
  ])("rejects a card with %s so it renders as plain code", (_, source) => {
    expect(parseDecisionCard(source)).toBeNull();
  });

  it("keeps the card but drops a recommended index outside the options", () => {
    const source = JSON.stringify({
      question: "q",
      options: [{ label: "a" }, { label: "b" }],
      recommended: 5,
    });
    expect(parseDecisionCard(source)?.recommended).toBeUndefined();
  });
});

describe("DecisionCard", () => {
  beforeEach(() => {
    sendMessage.mockClear();
  });

  it("sends the chosen option as the user's next message and locks the card", () => {
    const spec = parseDecisionCard(VALID_CARD);
    if (!spec) throw new Error("fixture should parse");
    render(<DecisionCard spec={spec} />);

    fireEvent.click(screen.getByRole("button", { name: /git pull.rebase/ }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({
      role: "user",
      content: [{ type: "text", text: "git pull.rebase" }],
    });
    for (const button of screen.getAllByRole("button")) {
      expect(button).toBeDisabled();
    }
  });
});
