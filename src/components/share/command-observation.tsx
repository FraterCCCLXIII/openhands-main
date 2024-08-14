interface CommandObservationProps {
  observation: CommandObservation;
}

export const CommandObservation: React.FC<CommandObservationProps> = ({ observation }) => {
  return (
    <section className="w-[1000px] bg-orange-200 rounded-md">
      <div className="bg-orange-400 rounded-t-md">
        <span>Assistant Shell Observation</span>
      </div>
      <p>{observation.content}</p>
    </section>
  );
};
