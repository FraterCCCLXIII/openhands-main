interface CommandActionProps {
  command: CommandAction;
}

export const CommandAction: React.FC<CommandActionProps> = ({ command }) => {
  return (
    <section className="w-[1000px] bg-green-200 rounded-md">
      <div className="bg-green-400 rounded-t-md">
        <span>Assistant Shell Action</span>
      </div>
      <p>{command.args.thought}</p>
      <p>{command.message}</p>
      <p>{command.args.command}</p>
    </section>
  );
};
