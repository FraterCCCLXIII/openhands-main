import {
  isAgentStateChange,
  isUserMessage,
  isAssistantMessage,
  isCommandAction,
  isCommandObservation,
  isIPythonAction,
  isIPythonObservation,
  isFinishAction,
  isErrorObservation,
  isReadAction,
  isReadObservation,
  isEditAction,
  isEditObservation
} from "../../utils/share";
import { CSyntaxHighlighter } from "../c-syntax-highlighter";
import {
  AgentStateChangeComponent,
  UserMessageComponent,
  AssistantMessageComponent,
  CommandActionComponent,
  CommandObservationComponent,
  IPythonActionComponent,
  IPythonObservationComponent,
  FinishActionComponent,
  ReadActionComponent,
  ReadObservationComponent,
  EditActionComponent,
  EditObservationComponent
} from "./trajectory-list-items";
import { TrajectoryCard } from "./trajectory-card";
import { ErrorObservationComponent } from "./trajectory-list-items/assistant-message copy";
import { TrajectoryItem } from '../../types';

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
          return <AgentStateChangeComponent key={index} state={item} />;
        } else if (isUserMessage(item)) {
          return <UserMessageComponent key={index} message={item} />;
        } else if (isAssistantMessage(item)) {
          return <AssistantMessageComponent key={index} message={item} />;
        } else if (isCommandAction(item)) {
          return <CommandActionComponent key={index} command={item} />;
        } else if (isCommandObservation(item)) {
          return <CommandObservationComponent key={index} observation={item} />;
        } else if (isIPythonAction(item)) {
          return <IPythonActionComponent key={index} action={item} />;
        } else if (isIPythonObservation(item)) {
          return <IPythonObservationComponent key={index} observation={item} />;
        } else if (isFinishAction(item)) {
          return <FinishActionComponent key={index} action={item} />;
        } else if (isErrorObservation(item)) {
          return <ErrorObservationComponent key={index} observation={item} />;
        } else if (isReadAction(item)) {
          return <ReadActionComponent key={index} item={item} />;
        } else if (isReadObservation(item)) {
          return <ReadObservationComponent key={index} observation={item} />;
        } else if (isEditAction(item)) {
          return <EditActionComponent key={index} item={item} />;
        } else if (isEditObservation(item)) {
          return <EditObservationComponent key={index} observation={item} />;
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
