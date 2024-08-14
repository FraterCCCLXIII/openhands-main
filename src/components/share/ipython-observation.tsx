interface IPythonObservationProps {
  observation: IPythonObservation;
}

export const IPythonObservation: React.FC<IPythonObservationProps> = ({ observation }) => {
  return (
    <section className="w-[1000px] bg-orange-200 rounded-md">
      <div className="bg-orange-400 rounded-t-md">
        <span>IPython Observation</span>
      </div>
      <p>{observation.message}</p>
      <p>{observation.content}</p>
    </section>
  );
};
