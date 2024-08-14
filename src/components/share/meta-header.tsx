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
    <header className="bg-white p-4 rounded-md text-center flex flex-col gap-4">
      <div className="grid grid-cols-2">
        <span>Feedback: {meta.feedback}</span>
        <span>Permission: {meta.permissions}</span>
        <span>Timestamp: {meta.timestamp}</span>
        <span>Agent: {meta.agent}</span>
        <span>Language: {meta.language}</span>
        <span>Model: {meta.model}</span>
      </div>
    </header>
  );
};
