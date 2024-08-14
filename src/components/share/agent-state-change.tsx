interface AgentStateChangeProps {
  state: AgentStateChange;
}

export const AgentStateChange: React.FC<AgentStateChangeProps> = ({ state }) => {
  return (
    <section className="w-[1000px] bg-amber-300 rounded-md flex gap-1">
      <span>Agent State Change</span>
      <span>{"\u2192"}</span>
      <p>{state.extras.agent_state}</p>
    </section>
  );
}
