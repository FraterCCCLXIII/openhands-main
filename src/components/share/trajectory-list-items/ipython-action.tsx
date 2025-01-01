import { TrajectoryCard } from "../trajectory-card";
import { CSyntaxHighlighter } from "../../c-syntax-highlighter";

import type { IPythonAction } from '../../../types';

interface IPythonActionProps {
  action: IPythonAction;
}

export const IPythonActionComponent: React.FC<IPythonActionProps> = ({ action }) => {
  return (
    <TrajectoryCard className="bg-blue-200">
      <TrajectoryCard.Header className="bg-blue-400">IPython Action</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {action.args.thought}
        <CSyntaxHighlighter language="python">{action.args.code}</CSyntaxHighlighter>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
