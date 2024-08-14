import { LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import { json } from "react-router-dom";
import { CSyntaxHighlighter } from "~/components/c-syntax-highlighter";
import {
  AgentStateChange,
  UserMessage,
  AssistantMessage,
  CommandAction,
  CommandObservation,
  IPythonAction,
  IPythonObservation,
  FinishAction
} from "~/components/share";
import { TrajectoryCard } from "~/components/share/trajectory-card";
import {
  isAgentStateChange,
  isAssistantMessage,
  isCommandAction,
  isCommandObservation,
  isConfig, isFinishAction,
  isIPythonAction,
  isIPythonObservation,
  isUserMessage
} from "~/utils/share";

interface TrajectoryData {
  version: string;
  feedback: "positive" | "negative";
  permissions: "public" | "private";
  timestamp: string;
  trajectory: TrajectoryItem[];
}

interface TrajectoryMeta {
  feedback: "positive" | "negative";
  permissions: "public" | "private";
  timestamp: string;
  agent: string;
  language: string;
  model: string;
}

const fetchTrajectoryData = async (id: string): Promise<TrajectoryData> => {
  const response = await fetch('https://show-od-trajectory-3u9bw9tx.uc.gateway.dev/show-od-trajectory', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ feedback_id: id })
  });

  return response.json();
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('share_id');

  if (!id) return json(null);
  const data = await fetchTrajectoryData(id);

  const config = data.trajectory.find(isConfig);
  const trajectory = data.trajectory.filter((item) => !isConfig(item));

  const meta: TrajectoryMeta = {
    feedback: data.feedback,
    permissions: data.permissions,
    timestamp: data.timestamp,
    agent: config?.args?.AGENT || "",
    language: config?.args?.LANGUAGE || "",
    model: config?.args?.LLM_MODEL || "",
  }
  return {
    trajectory,
    meta,
  };
};

const Share = () => {
  const data = useLoaderData() as {
    trajectory: TrajectoryData["trajectory"];
    meta: TrajectoryMeta;
  } | null;

  if (!data) {
    return (
      <div>
        <h1>Error</h1>
        <p>There was an error loading the trajectory.</p>
      </div>
    );
  }

  const { trajectory, meta } = data;

  return (
    <main className="flex flex-col items-center gap-8 py-[45px]">
      <h1 className="heading">Share</h1>

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

      <div className="flex flex-col items-center gap-2">
        {trajectory.map((item, index) => {
          if (isAgentStateChange(item)) {
            return <AgentStateChange key={index} state={item} />;
          } else if (isUserMessage(item)) {
            return <UserMessage key={index} message={item} />;
          } else if (isAssistantMessage(item)) {
            return <AssistantMessage key={index} message={item} />;
          } else if (isCommandAction(item)) {
            return <CommandAction key={index} command={item} />;
          } else if (isCommandObservation(item)) {
            return <CommandObservation key={index} observation={item} />;
          } else if (isIPythonAction(item)) {
            return <IPythonAction key={index} action={item} />;
          } else if (isIPythonObservation(item)) {
            return <IPythonObservation key={index} observation={item} />;
          } else if (isFinishAction(item)) {
            return <FinishAction key={index} action={item} />;
          } else {
            return (
              <TrajectoryCard key={index}>
                <CSyntaxHighlighter
                  language="json"
                  key={index}
                >
                  {JSON.stringify(item, null, 2)}
                </CSyntaxHighlighter>
              </TrajectoryCard>
            );
          }
        })}
      </div>
    </main>
  );
};

export default Share;
