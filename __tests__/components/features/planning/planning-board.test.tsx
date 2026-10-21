import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { PlanningBoard } from "#/components/features/planning/planning-board";
import { GanttView } from "#/components/features/planning/gantt-view";
import type { Sprint, Ticket } from "#/planning/types";
import { usePlanningStore } from "#/stores/planning-store";
import { renderWithProviders } from "../../../../test-utils";

const baseTicket: Ticket = {
  id: "T-1",
  title: "Write docs",
  description: "",
  status: "todo",
  priority: "medium",
  assignee: "human",
  sprintId: "S-1",
  startDate: "2030-01-02",
  dueDate: "2030-01-05",
  estimate: 3,
  labels: [],
};

const sprint: Sprint = {
  id: "S-1",
  name: "Alpha",
  startDate: "2030-01-01",
  endDate: "2030-01-10",
  goal: "Ship alpha",
};

function seed(tickets: Ticket[], sprints: Sprint[] = [sprint]) {
  usePlanningStore.setState({ tickets, sprints });
}

function column(status: string) {
  return screen.getByTestId(`column-${status}`);
}

describe("PlanningBoard kanban", () => {
  beforeEach(() => {
    seed([baseTicket]);
  });

  it("moves a ticket to the next column with the move button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlanningBoard />);

    await user.click(
      screen.getByRole("button", { name: /PLANNING\$MOVE_NEXT/ }),
    );

    expect(within(column("in_progress")).getByText("Write docs")).toBeVisible();
    expect(within(column("todo")).queryByText("Write docs")).toBeNull();
  });

  it("changes status when a card is dragged to another column", () => {
    renderWithProviders(<PlanningBoard />);

    fireEvent.dragStart(screen.getByTestId("ticket-card-T-1"));
    fireEvent.drop(column("done"));

    expect(within(column("done")).getByText("Write docs")).toBeVisible();
  });

  it("shows a newly created ticket in the backlog column", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlanningBoard />);

    await user.click(
      screen.getByRole("button", { name: "PLANNING$NEW_TICKET" }),
    );
    await user.type(
      screen.getByLabelText("PLANNING$TICKET_TITLE"),
      "Fix flaky test",
    );
    await user.click(screen.getByRole("button", { name: "BUTTON$CREATE" }));

    expect(within(column("backlog")).getByText("Fix flaky test")).toBeVisible();
  });

  it("removes a ticket deleted from the detail panel", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlanningBoard />);

    await user.click(screen.getByRole("button", { name: "Write docs" }));
    await user.click(
      screen.getByRole("button", { name: "PLANNING$DELETE_TICKET" }),
    );

    expect(screen.queryByText("Write docs")).toBeNull();
    expect(screen.queryByTestId("ticket-panel")).toBeNull();
  });

  it("edits a ticket's status from the detail panel", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PlanningBoard />);

    await user.click(screen.getByRole("button", { name: "Write docs" }));
    await user.selectOptions(screen.getByLabelText("COMMON$STATUS"), "review");

    expect(within(column("review")).getByText("Write docs")).toBeVisible();
  });
});

describe("PlanningBoard sprint view", () => {
  it("shows committed versus done points for the sprint", async () => {
    seed([
      baseTicket,
      {
        ...baseTicket,
        id: "T-2",
        title: "Ship it",
        status: "done",
        estimate: 5,
      },
    ]);
    const user = userEvent.setup();
    renderWithProviders(<PlanningBoard />);

    await user.click(screen.getByRole("tab", { name: "PLANNING$TAB_SPRINT" }));

    expect(screen.getByTestId("sprint-points")).toHaveTextContent(
      "PLANNING$POINTS_SUMMARY",
    );
    expect(screen.getByTestId("sprint-goal")).toHaveTextContent("Ship alpha");
    expect(screen.getByText("Ship it")).toBeVisible();
  });
});

describe("GanttView", () => {
  it("sizes bars by their date span within the visible range", () => {
    // Range 2030-01-01..2030-01-10 is 10 days; a 4-day ticket is 40% wide
    // and starts one day in.
    seed([baseTicket]);
    renderWithProviders(
      <GanttView onSelectTicket={() => {}} today="2030-01-03" />,
    );

    const bar = screen.getByTestId("gantt-bar-T-1");

    expect(bar.style.getPropertyValue("--bar-width")).toBe("40");
    expect(bar.style.getPropertyValue("--bar-left")).toBe("10");
    expect(screen.getByTestId("today-marker-T-1")).toBeInTheDocument();
  });

  it("groups bars under their sprint", () => {
    seed([baseTicket]);
    renderWithProviders(
      <GanttView onSelectTicket={() => {}} today="2030-01-03" />,
    );

    expect(
      within(screen.getByRole("region", { name: "Alpha" })).getByTestId(
        "gantt-bar-T-1",
      ),
    ).toBeInTheDocument();
  });
});
