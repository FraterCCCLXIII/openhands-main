import { TrajectoryCard } from "../trajectory-card";

import type { FinishAction } from '../../../types';

interface FinishActionProps {
  action: FinishAction;
}

export const FinishActionComponent: React.FC<FinishActionProps> = ({ action }) => {
  return (
    <TrajectoryCard className=" bg-violet-200">
      <TrajectoryCard.Header className="bg-violet-400">Finish Action</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {action.args.thought}
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
