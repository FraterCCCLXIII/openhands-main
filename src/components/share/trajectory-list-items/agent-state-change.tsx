import { TrajectoryCard } from "../trajectory-card";

interface AgentStateChangeProps {
  state: AgentStateChange;
}

export const AgentStateChange: React.FC<AgentStateChangeProps> = ({ state }) => {
  return (
    <TrajectoryCard className="bg-amber-200 flex gap-1 p-2 border border-amber-400">
      <span>Agent State Change</span>
      <span>{"\u2192"}</span>
      <span className="font-bold">
        {("args" in state && state.args.agent_state) || 
         ("extras" in state && state.extras.agent_state)}
      </span>
    </TrajectoryCard>
  );
}
