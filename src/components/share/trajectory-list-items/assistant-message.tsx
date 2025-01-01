import { TrajectoryCard } from "../trajectory-card";

import type { AssistantMessage } from '../../../types';

interface AssistantMessageProps {
  message: AssistantMessage;
}

export const AssistantMessageComponent: React.FC<AssistantMessageProps> = ({ message }) => {
  return (
    <TrajectoryCard className="bg-indigo-200">
      <TrajectoryCard.Header className="bg-indigo-400">Assistant</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {message.args?.content || message.content || ""}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
