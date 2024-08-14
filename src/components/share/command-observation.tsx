import { TrajectoryCard } from "./trajectory-card";
import { CSyntaxHighlighter } from "../c-syntax-highlighter";

interface CommandObservationProps {
  observation: CommandObservation;
}

export const CommandObservation: React.FC<CommandObservationProps> = ({ observation }) => {
  return (
    <TrajectoryCard className="bg-orange-200">
      <TrajectoryCard.Header className="bg-orange-400">Assistant Shell Observation</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <CSyntaxHighlighter language="shell">{observation.content}</CSyntaxHighlighter>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
