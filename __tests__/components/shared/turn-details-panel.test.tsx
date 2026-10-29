import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TurnDetailsPanel } from "#/components/shared/turn-details-panel";
import { SecurityRisk } from "#/types/agent-server/core/base/common";
import type { FeedUpdateDetails } from "#/utils/feed-updates";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, vars?: Record<string, unknown>) =>
      vars ? `${key} ${Object.values(vars).join(" ")}` : key,
  }),
}));

const base: FeedUpdateDetails = { redacted: false };

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
