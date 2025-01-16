import { TrajectoryCard } from "../trajectory-card";
import { CSyntaxHighlighter } from "../../c-syntax-highlighter";

import type { CommandObservation } from '../../../types';

interface CommandObservationProps {
  observation: CommandObservation;
}

export const CommandObservationComponent: React.FC<CommandObservationProps> = ({ observation }) => {
  return (
    <TrajectoryCard className="bg-orange-200">
      <TrajectoryCard.Header className="bg-orange-400">Assistant Shell Observation</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <CSyntaxHighlighter language="shell">{observation.content}</CSyntaxHighlighter>
        {observation.extras.metadata && (
          <>
            <div className="mt-2 text-sm font-semibold">Metadata:</div>
            <CSyntaxHighlighter language="json">
              {JSON.stringify(observation.extras.metadata, null, 2)}
            </CSyntaxHighlighter>
          </>
        )}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
