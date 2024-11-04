import {
  isAgentStateChange,
  isUserMessage,
  isAssistantMessage,
  isCommandAction,
  isCommandObservation,
  isIPythonAction,
  isIPythonObservation,
  isFinishAction,
  isErrorObservation
} from "~/utils/share";
import { CSyntaxHighlighter } from "../c-syntax-highlighter";
import {
  AgentStateChange,
  UserMessage,
  AssistantMessage,
  CommandAction,
  CommandObservation,
  IPythonAction,
  IPythonObservation,
  FinishAction
} from "./trajectory-list-items";
import { TrajectoryCard } from "./trajectory-card";
import { ErrorObservation } from "./trajectory-list-items/assistant-message copy";

interface TrajectoryListProps {
  trajectory: TrajectoryItem[];
}

export const TrajectoryList: React.FC<TrajectoryListProps> = ({ trajectory }) => {
  const shouldDisplayItem = (item: TrajectoryItem): boolean => {
    // Filter out change_agent_state actions
    if ("action" in item && item.action === "change_agent_state" as const) {
      return false;
    }

    // Filter out null observations
    if ("observation" in item && typeof item.observation === "string" && item.observation === "null") {
      return false;
    }

    // Keep all other items
    return true;
  };

  // Apply filtering to remove unwanted events
  const filteredTrajectory = trajectory.filter(shouldDisplayItem);

  return (
    <div className="flex flex-col items-center gap-2">
      {filteredTrajectory.map((item, index) => {
        if (isAgentStateChange(item)) {
          return <AgentStateChange key={index} state={item} />;
        } else if (isUserMessage(item)) {
          return <UserMessage key={index} message={item} />;
        } else if (isAssistantMessage(item)) {
          return <AssistantMessage key={index} message={item} />;
        } else if (isCommandAction(item)) {
          return <CommandAction key={index} command={item} />;
        } else if (isCommandObservation(item)) {
          return <CommandObservation key={index} observation={item} />;
        } else if (isIPythonAction(item)) {
          return <IPythonAction key={index} action={item} />;
        } else if (isIPythonObservation(item)) {
          return <IPythonObservation key={index} observation={item} />;
        } else if (isFinishAction(item)) {
          return <FinishAction key={index} action={item} />;
        } else if (isErrorObservation(item)) {
          return <ErrorObservation key={index} observation={item} />;
        } else {
          return (
            <TrajectoryCard key={index}>
              <CSyntaxHighlighter
                language="json"
                key={index}
              >
                {JSON.stringify(item, null, 2)}
              </CSyntaxHighlighter>
            </TrajectoryCard>
          );
        }
      })}
    </div>
  );
};
