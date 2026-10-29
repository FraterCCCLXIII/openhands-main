import { useMemo } from "react";
import { useEventStore, type OHEvent } from "#/stores/use-event-store";
import { isObservationEvent } from "#/types/agent-server/type-guards";
import type { TaskTrackerObservation } from "#/types/agent-server/core/base/observation";
import type { ObservationEvent } from "#/types/agent-server/core/events/observation-event";

export interface TaskListItem {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  notes?: string;
}

function isTaskTrackerPlanEvent(event: OHEvent): boolean {
  return (
    isObservationEvent(event) &&
    event.observation.kind === "TaskTrackerObservation" &&
    (event as ObservationEvent<TaskTrackerObservation>).observation.command ===
      "plan"
  );
}

function getTaskListFromEvent(event: OHEvent): TaskListItem[] | null {
  if (
    isObservationEvent(event) &&
    event.observation.kind === "TaskTrackerObservation"
  ) {
    const obs = (event as ObservationEvent<TaskTrackerObservation>).observation;
    if (obs.command === "plan") {
      return obs.task_list.map((t, i) => ({
        id: String(i + 1),
        title: t.title,
        status: t.status,
        notes: t.notes || undefined,
      }));
    }
  }

  return null;
}

export function useTaskList() {
  const events = useEventStore((state) => state.events);

  return useMemo(() => {
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const taskList = getTaskListFromEvent(events[i]);
      if (taskList) {
        return { taskList, hasTaskList: taskList.length > 0 };
      }
    }

    return { taskList: [] as TaskListItem[], hasTaskList: false };
  }, [events]);
}

/**
 * Returns the ID of the latest TaskTrackerObservation event with command="plan".
 * Returns null if there is no such event.
 */
export function useLatestTaskTrackerEventId(): string | number | null {
  const events = useEventStore((state) => state.events);

  return useMemo(() => {
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i];
      if (isTaskTrackerPlanEvent(event) && "id" in event && event.id != null) {
        return event.id;
      }
    }
    return null;
  }, [events]);
}
