import React from "react";
import { useTranslation } from "react-i18next";
import { ObservationEvent } from "#/types/agent-server/core";
import { TaskTrackerObservation } from "#/types/agent-server/core/base/observation";
import { TaskListSection } from "./task-list-section";
import { useLatestTaskTrackerEventId } from "#/hooks/use-task-list";
import { I18nKey } from "#/i18n/declaration";
import LessonPlanIcon from "#/icons/lesson-plan.svg?react";

interface TaskTrackingObservationContentProps {
  event: ObservationEvent<TaskTrackerObservation>;
}

export function TaskTrackingObservationContent({
  event,
}: TaskTrackingObservationContentProps): React.ReactNode {
  const { t } = useTranslation("openhands");
  const latestEventId = useLatestTaskTrackerEventId();
  const { observation } = event;
  const { command, task_list: taskList } = observation;
  const isLatestEvent = event.id === latestEventId;
  const shouldShowTaskList =
    command === "plan" && taskList.length > 0 && isLatestEvent;

  // For older task tracker events, show a collapsed summary
  if (command === "plan" && taskList.length > 0 && !isLatestEvent) {
    const doneCount = taskList.filter((task) => task.status === "done").length;
    const totalCount = taskList.length;

    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-xl text-muted">
        <LessonPlanIcon className="shrink-0 w-4 h-4" />
        <span className="text-xs">
          {t(I18nKey.TASK_TRACKING$UPDATED_SUMMARY, {
            done: doneCount,
            total: totalCount,
          })}
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Task List section - only show for 'plan' command on the latest event */}
      {shouldShowTaskList && <TaskListSection taskList={taskList} />}
    </div>
  );
}
