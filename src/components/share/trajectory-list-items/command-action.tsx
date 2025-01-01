import { CSyntaxHighlighter } from "../../c-syntax-highlighter";
import { TrajectoryCard } from "../trajectory-card";

import type { CommandAction } from '../../../types';

interface CommandActionProps {
  command: CommandAction;
}

export const CommandActionComponent: React.FC<CommandActionProps> = ({ command }) => {
  return (
    <TrajectoryCard className="bg-green-200">
      <TrajectoryCard.Header className="bg-green-400">Assistant Shell Action</TrajectoryCard.Header>
      <TrajectoryCard.Body>
        {command.args.thought}
        <CSyntaxHighlighter language="shell">{command.args.command}</CSyntaxHighlighter>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};
