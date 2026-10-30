import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  buildActivity,
  inFlight,
} from "#/components/features/automations/factory/pipeline-activity";
import {
  ActivityMarks,
  HangingChips,
} from "#/components/features/automations/factory/pipeline-activity-ui";
import { PIPELINE_TEMPLATES } from "#/components/features/automations/factory/pipeline-templates";

describe("pipeline activity", () => {
  const steps = PIPELINE_TEMPLATES[0].steps;

  it("gives the same numbers on every visit, and different ones per factory", () => {
    expect(buildActivity(steps, "web")).toEqual(buildActivity(steps, "web"));
    expect(buildActivity(steps, "web")).not.toEqual(
      buildActivity(steps, "mobile"),
    );
  });

  it("covers some steps and not others, with PR numbers on the code steps", () => {
    const activity = buildActivity(steps, "web");
    const keys = Object.keys(activity);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.length).toBeLessThan(steps.length);
    expect(Object.values(activity).some((a) => a.prs.length > 0)).toBe(true);
  });

  it("counts everything waiting or running as in flight", () => {
    expect(
      inFlight({
        live: 1,
        queued: 2,
        blocked: 3,
        prs: [],
        tickets: [],
        agents: [],
        waitMinutes: null,
        perDay: null,
        lastMinutesAgo: null,
      }),
    ).toBe(6);
    expect(inFlight(undefined)).toBe(0);
  });
});

describe("pipeline activity marks", () => {
  const base = {
    live: 0,
    queued: 0,
    blocked: 0,
    prs: [],
    tickets: [],
    agents: [],
    waitMinutes: null,
    perDay: null,
    lastMinutesAgo: null,
  };

  it("shows a status dot and queue number only when there is something to show", () => {
    const { rerender } = render(<ActivityMarks activity={base} />);
    expect(screen.queryByTestId("pipeline-status-dot")).toBeNull();
    expect(screen.queryByTestId("pipeline-queue-bubble")).toBeNull();

    rerender(<ActivityMarks activity={{ ...base, live: 2, queued: 7 }} />);
    expect(screen.getByTestId("pipeline-status-dot")).toHaveAttribute(
      "data-state",
      "live",
    );
    expect(screen.getByTestId("pipeline-queue-bubble")).toHaveTextContent("7");
  });

  it("marks a step with blocked work as blocked even while others run", () => {
    render(<ActivityMarks activity={{ ...base, live: 1, blocked: 2 }} />);
    expect(screen.getByTestId("pipeline-status-dot")).toHaveAttribute(
      "data-state",
      "blocked",
    );
    expect(screen.getByTestId("pipeline-blocked-bubble")).toHaveTextContent(
      "2",
    );
  });

  it("hangs at most three PR numbers and counts the rest", () => {
    const prs = [101, 102, 103, 104].map((number) => ({
      number,
      state: "open" as const,
    }));
    render(<HangingChips activity={{ ...base, prs }} />);
    expect(screen.getAllByTestId("pipeline-pr-chip")).toHaveLength(3);
    expect(screen.getByText("+1")).toBeInTheDocument();
  });
});
