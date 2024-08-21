export interface TrajectoryMeta {
  feedback: "positive" | "negative";
  permissions: "public" | "private";
  timestamp: string;
  agent: string;
  language: string;
  model: string;
}

interface MetaHeaderProps {
  meta: TrajectoryMeta;
}

export const MetaHeader: React.FC<MetaHeaderProps> = ({ meta }) => {
  return (
    <header className="bg-white p-4 rounded-md flex flex-col gap-4">
      <h2 className="font-quincy text-3xl self-center">Metadata</h2>
      <div className="flex gap-16 paragraph">
        <div className="flex flex-col gap-2">
          <span>Feedback: {meta.feedback}</span>
          <span>Permission: {meta.permissions}</span>
          <span>Timestamp: {meta.timestamp}</span>
        </div>
        <div className="flex flex-col gap-2">
          <span>Agent: {meta.agent}</span>
          <span>Language: {meta.language}</span>
          <span>Model: {meta.model}</span>
        </div>
      </div>
    </header>
  );
};
