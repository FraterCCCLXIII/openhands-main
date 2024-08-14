import { TrajectoryCard } from "../trajectory-card";

interface FinishActionProps {
  action: FinishAction;
}

export const FinishAction: React.FC<FinishActionProps> = ({ action }) => {
  return (
    <TrajectoryCard className=" bg-violet-200">
      <TrajectoryCard.Header className="bg-violet-400">Finish Action</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {action.args.thought}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
