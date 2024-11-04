import { TrajectoryCard } from "../trajectory-card";

interface AssistantMessageProps {
  message: AssistantMessage;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({ message }) => {
  return (
    <TrajectoryCard className="bg-indigo-200">
      <TrajectoryCard.Header className="bg-indigo-400">Assistant</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {message.args?.content || message.content || ""}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
