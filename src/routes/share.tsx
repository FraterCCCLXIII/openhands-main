import { useLoaderData } from "react-router-dom";
import TRAJECTORY from "~/../TEMP.json";
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

export const loader = async () => {
  return {
    TRAJECTORY,
    config: TRAJECTORY.trajectory.find(isConfig),
  };
};

const Share = () => {
  const { TRAJECTORY, config } = useLoaderData() as {
    TRAJECTORY: { feedback: string; permissions: string; timestamp: string; trajectory: [] };
    config: Config;
  };

  return (
    <main className="flex flex-col items-center gap-8 py-[45px]">
      <header className="bg-white p-4 rounded-md text-center flex flex-col gap-4">
        <h1 className="heading">Share</h1>

        <div className="grid grid-cols-2">
          <span>Feedback: {TRAJECTORY.feedback}</span>
          <span>Permission: {TRAJECTORY.permissions}</span>
          <span>Timestamp: {TRAJECTORY.timestamp}</span>
          <span>Agent: {config.args.AGENT}</span>
          <span>Language: {config.args.LANGUAGE}</span>
          <span>Model: {config.args.LLM_MODEL}</span>
        </div>
      </header>

      <div className="flex flex-col items-center gap-2">
        {TRAJECTORY.trajectory.map((item: any, index: number) => {
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
