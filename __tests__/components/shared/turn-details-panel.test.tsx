import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TurnDetailsPanel } from "#/components/shared/turn-details-panel";
import { SecurityRisk } from "#/types/agent-server/core/base/common";
import { useTurnDetailsStore } from "#/stores/turn-details-store";
import type { FeedUpdateDetails } from "#/utils/feed-updates";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key} ${Object.values(vars).join(" ")}` : key,
  }),
}));

const base: FeedUpdateDetails = { redacted: false };

const usage = (model: string, cost: number) => ({
  model,
  promptTokens: 28979,
  completionTokens: 100,
  reasoningTokens: 0,
  cacheReadTokens: 0,
  contextTokens: 29079,
  contextWindow: 0,
  cost,
  shared: false,
});

describe("TurnDetailsPanel conversation totals", () => {
  it("adds the other model calls beside each number when the toggle is on", async () => {
    useTurnDetailsStore.setState({ showConversationTotals: false });
    const call = usage("anthropic/claude-sonnet", 0.01);
    const total = {
      ...call,
      promptTokens: 1_028_979,
      completionTokens: 5100,
      cost: 0.51,
    };
    render(
      <TurnDetailsPanel
        details={{ ...base, usage: call, conversationUsage: total }}
      />,
    );
    expect(screen.queryAllByTestId("turn-details-stat-extra")).toHaveLength(0);

    await userEvent.click(screen.getByTestId("turn-details-totals-toggle"));

    const extras = screen
      .getAllByTestId("turn-details-stat-extra")
      .map((n) => n.textContent);
    expect(extras).toContain("+1M");
    expect(extras).toContain("+5K");
    expect(extras).toContain("+$0.50");

    // A call whose own cost was not reported does not get "+": the figure is the conversation's total.
    useTurnDetailsStore.setState({ showConversationTotals: true });
    cleanup();
    render(
      <TurnDetailsPanel
        details={{
          ...base,
          usage: usage("anthropic/claude-sonnet", 0),
          conversationUsage: total,
        }}
      />,
    );
    expect(
      screen
        .getAllByTestId("turn-details-stat-extra")
        .map((n) => n.textContent),
    ).toContain("FEED$DETAILS_COST_CONVERSATION $0.51");
    useTurnDetailsStore.setState({ showConversationTotals: false });
  });

  it("has no toggle without a conversation total", () => {
    render(<TurnDetailsPanel details={{ ...base, usage: usage("m", 0) }} />);
    expect(
      screen.queryByTestId("turn-details-totals-toggle"),
    ).not.toBeInTheDocument();
  });
});

describe("TurnDetailsPanel code activity", () => {
  it("shows diffs with added and removed lines, a lines chip and the git actions", () => {
    render(
      <TurnDetailsPanel
        details={{
          ...base,
          changes: [
            {
              path: "/src/a.ts",
              kind: "edit",
              added: 1,
              removed: 1,
              truncated: false,
              lines: [
                { type: "del", text: "old" },
                { type: "add", text: "new" },
              ],
            },
          ],
          gitActions: [
            { command: "git commit", detail: "Fix it", sha: "abc1234" },
          ],
        }}
      />,
    );

    expect(screen.getByTestId("turn-details-chip-lines")).toHaveTextContent(
      "+1−1",
    );
    const rows = screen
      .getAllByTestId("turn-details-diff")[0]
      .querySelectorAll("[data-diff]");
    expect([...rows].map((r) => r.getAttribute("data-diff"))).toEqual([
      "del",
      "add",
    ]);
    expect(screen.getByTestId("turn-details-git-actions")).toHaveTextContent(
      "git commit",
    );
    expect(screen.getByTestId("turn-details-git-actions")).toHaveTextContent(
      "abc1234",
    );
  });
});

describe("TurnDetailsPanel cost", () => {
  it("always shows a cost: the reported price, free for a local model, else not reported", () => {
    const { rerender } = render(
      <TurnDetailsPanel
        details={{ ...base, usage: usage("anthropic/claude-sonnet", 0.0123) }}
      />,
    );
    expect(screen.getByTestId("turn-details-chip-cost")).toHaveTextContent(
      "$0.0123",
    );

    rerender(
      <TurnDetailsPanel
        details={{ ...base, usage: usage("ollama_chat/gpt-oss:20b", 0) }}
      />,
    );
    expect(screen.getByTestId("turn-details-chip-cost")).toHaveTextContent(
      "FEED$DETAILS_COST_LOCAL",
    );

    rerender(
      <TurnDetailsPanel
        details={{ ...base, usage: usage("some/unpriced-model", 0) }}
      />,
    );
    expect(screen.getByTestId("turn-details-chip-cost")).toHaveTextContent(
      "FEED$DETAILS_COST_NOT_REPORTED",
    );
  });
});

describe("TurnDetailsPanel", () => {
  it("shows header chips for risk, duration and exit code", () => {
    render(
      <TurnDetailsPanel
        details={{
          ...base,
          risk: SecurityRisk.HIGH,
          durationMs: 1500,
          outcome: { isError: true, exitCode: 2 },
        }}
      />,
    );

    const chips = within(screen.getByTestId("turn-details-chips"));
    expect(chips.getByTestId("turn-details-chip-risk")).toHaveTextContent(
      "HIGH",
    );
    expect(chips.getByTestId("turn-details-chip-duration")).toBeInTheDocument();
    expect(chips.getByTestId("turn-details-chip-exit-code")).toHaveTextContent(
      "2",
    );
    expect(chips.getByTestId("turn-details-chip-status")).toHaveTextContent(
      "FEED$DETAILS_OUTCOME_ERROR",
    );
  });

  it("hides the risk chip when the risk is unknown", () => {
    render(
      <TurnDetailsPanel
        details={{ ...base, risk: SecurityRisk.UNKNOWN, durationMs: 10 }}
      />,
    );

    expect(
      screen.queryByTestId("turn-details-chip-risk"),
    ).not.toBeInTheDocument();
  });

  it("renders only the modules that have data", () => {
    render(
      <TurnDetailsPanel
        details={{ ...base, args: [{ key: "command", value: "ls" }] }}
      />,
    );

    expect(screen.getAllByTestId("turn-details-module")).toHaveLength(1);
    expect(screen.queryByTestId("turn-details-chips")).not.toBeInTheDocument();
  });

  it("copies the result", async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockResolvedValue();
    render(<TurnDetailsPanel details={{ ...base, result: "all green" }} />);

    await user.click(screen.getByTestId("turn-details-copy"));

    expect(writeText).toHaveBeenCalledWith("all green");
  });

  it("folds long reasoning behind a toggle", async () => {
    const user = userEvent.setup();
    render(
      <TurnDetailsPanel details={{ ...base, reasoning: "x".repeat(400) }} />,
    );

    const toggle = screen.getByRole("button", {
      name: "FEED$DETAILS_SHOW_MORE",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });
});
