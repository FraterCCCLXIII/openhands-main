import { useLoaderData } from "react-router-dom";
import TRAJECTORY from "~/../TEMP.json";
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

export const loader = () => {
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
    <main className="flex flex-col items-center">
      <header className="bg-white p-4 rounded-md">
        <h1 className="heading">Share</h1>
        <span>{TRAJECTORY.feedback}</span>
        <span>{TRAJECTORY.permissions}</span>
        <span>{TRAJECTORY.timestamp}</span>
        <span>{config.args.AGENT}</span>
        <span>{config.args.LANGUAGE}</span>
        <span>{config.args.LLM_MODEL}</span>
      </header>

      <div className="flex flex-col gap-4">
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
            return <div key={index}>Unknown message</div>;
          }
        })}
      </div>
    </main>
  );
};

export default Share;
