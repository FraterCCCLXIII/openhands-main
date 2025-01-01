import { TrajectoryCard } from "../trajectory-card";

import type { ErrorObservation } from '../../../types';

interface ErrorObservationProps {
  observation: ErrorObservation;
}

export const ErrorObservationComponent: React.FC<ErrorObservationProps> = ({ observation }) => {
  return (
    <TrajectoryCard className="bg-red-200">
      <TrajectoryCard.Header className="bg-red-400">Error</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {observation.message}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
