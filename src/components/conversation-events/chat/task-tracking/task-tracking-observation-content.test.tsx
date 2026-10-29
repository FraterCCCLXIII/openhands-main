import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { I18nKey } from "#/i18n/declaration";
import type { ObservationEvent } from "#/types/agent-server/core";
import type { TaskItem as TaskItemType } from "#/types/agent-server/core/base/common";
import type { TaskTrackerObservation } from "#/types/agent-server/core/base/observation";
import { useEventStore } from "#/stores/use-event-store";
import { TaskTrackingObservationContent } from "./task-tracking-observation-content";

const createTask = (overrides: Partial<TaskItemType> = {}): TaskItemType => ({
  title: "Inspect the behavior",
  notes: "",
  status: "todo",
  ...overrides,
});

const createTaskTrackingEvent = (
  observationOverrides: Partial<TaskTrackerObservation> = {},
  eventId = "observation-1",
): ObservationEvent<TaskTrackerObservation> => ({
  id: eventId,
  timestamp: "2026-07-13T12:00:00.000Z",
  source: "environment",
  tool_name: "task_tracker",
  tool_call_id: "tool-call-1",
  action_id: "action-1",
  observation: {
    kind: "TaskTrackerObservation",
    content: "Current plan",
    command: "plan",
    task_list: [createTask()],
    ...observationOverrides,
  },
});

describe("task tracking observations", () => {
  afterEach(() => {
    useEventStore.getState().clearEvents();
  });

  it("shows a non-empty plan when it is the latest event", () => {
    const event = createTaskTrackingEvent({
      task_list: [
        createTask({ title: "Inspect the behavior" }),
        createTask({ title: "Verify the result", status: "done" }),
      ],
    });

    // Add event to store so the component knows it's the latest
    useEventStore.getState().addEvent(event);

    render(<TaskTrackingObservationContent event={event} />);

    expect(screen.getByText(I18nKey.COMMON$TASKS)).toBeInTheDocument();
    expect(screen.getByText("Inspect the behavior")).toBeInTheDocument();
    expect(screen.getByText("Verify the result")).toBeInTheDocument();
  });

  it("shows summary for older plan events", () => {
    const olderEvent = createTaskTrackingEvent(
      {
        task_list: [
          createTask({ title: "Old task 1" }),
          createTask({ title: "Old task 2", status: "done" }),
        ],
      },
      "observation-1",
    );
    const newerEvent = createTaskTrackingEvent(
      {
        task_list: [createTask({ title: "New task" })],
      },
      "observation-2",
    );

    // Add both events to store, newer one is latest
    useEventStore.getState().addEvent(olderEvent);
    useEventStore.getState().addEvent(newerEvent);

    // Render the older event
    render(<TaskTrackingObservationContent event={olderEvent} />);

    // Should show summary, not full task list
    expect(screen.queryByText(I18nKey.COMMON$TASKS)).not.toBeInTheDocument();
    expect(screen.queryByText("Old task 1")).not.toBeInTheDocument();
    // The translation key is rendered since i18n is mocked
    expect(
      screen.getByText(I18nKey.TASK_TRACKING$UPDATED_SUMMARY),
    ).toBeInTheDocument();
  });

  it("hides task data emitted by commands other than plan", () => {
    const event = createTaskTrackingEvent({ command: "update" });

    useEventStore.getState().addEvent(event);
    render(<TaskTrackingObservationContent event={event} />);

    expect(screen.queryByText(I18nKey.COMMON$TASKS)).not.toBeInTheDocument();
    expect(screen.queryByText("Inspect the behavior")).not.toBeInTheDocument();
  });

  it("hides an empty plan", () => {
    const event = createTaskTrackingEvent({ task_list: [] });

    useEventStore.getState().addEvent(event);
    render(<TaskTrackingObservationContent event={event} />);

    expect(screen.queryByText(I18nKey.COMMON$TASKS)).not.toBeInTheDocument();
  });
});
