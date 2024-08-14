import { TrajectoryCard } from "../trajectory-card";

interface ErrorObservationProps {
  observation: ErrorObservation;
}

export const ErrorObservation: React.FC<ErrorObservationProps> = ({ observation }) => {
  return (
    <TrajectoryCard className="bg-red-200">
      <TrajectoryCard.Header className="bg-red-400">Error</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {observation.message}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
