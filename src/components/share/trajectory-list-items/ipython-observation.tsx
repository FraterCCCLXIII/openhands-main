import ReactSyntaxHighlighter from "react-syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";
import { CSyntaxHighlighter } from "../../c-syntax-highlighter";

import type { IPythonObservation } from '../../../types';

interface IPythonObservationProps {
  observation: IPythonObservation;
}

export const IPythonObservationComponent: React.FC<IPythonObservationProps> = ({ observation }) => {
  return (
    <TrajectoryCard className="bg-orange-200">
      <TrajectoryCard.Header className="bg-orange-400">IPython Observation</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {observation.message}
        <CSyntaxHighlighter language="shell">{observation.content}</CSyntaxHighlighter>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
