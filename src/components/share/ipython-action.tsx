interface IPythonActionProps {
  action: IPythonAction;
}

export const IPythonAction: React.FC<IPythonActionProps> = ({ action }) => {
  return (
    <section className="w-[1000px] bg-blue-200 rounded-md">
      <div className="bg-blue-400 rounded-t-md">
        <span>IPython Action</span>
      </div>
      <p>{action.args.thought}</p>
      <p>{action.args.code}</p>
    </section>
  );
};
