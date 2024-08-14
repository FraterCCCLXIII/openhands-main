interface FinishActionProps {
  action: FinishAction;
}

export const FinishAction: React.FC<FinishActionProps> = ({ action }) => {
  return (
    <section className="w-[1000px] bg-violet-200 rounded-md">
      <div className="bg-violet-400 rounded-t-md">
        <span>Finish Action</span>
      </div>
      <p>{action.args.thought}</p>
    </section>
  );
};
