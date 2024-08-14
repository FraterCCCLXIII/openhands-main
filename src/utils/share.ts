export const isConfig = (data: any): data is Config =>
  data.action === "initialize";

export const isAgentStateChange = (message: any): message is AgentStateChange =>
  message.observation === "agent_state_changed" && message.source === "agent";

export const isUserMessage = (message: any): message is UserMessage =>
  message.action === "message" && !message.source;

export const isAssistantMessage = (message: any): message is AssistantMessage =>
  message.action === "message" && message.source === "agent";

export const isCommandAction = (message: any): message is CommandAction =>
  message.action === "run" && message.source === "agent";

export const isCommandObservation = (message: any): message is CommandObservation =>
  message.observation === "run" && message.source === "agent";

export const isIPythonAction = (message: any): message is IPythonAction =>
  message.action === "run_ipython" && message.source === "agent";

export const isIPythonObservation = (message: any): message is IPythonObservation =>
  message.observation === "run_ipython" && message.source === "agent";

export const isFinishAction = (message: any): message is FinishAction =>
  message.action === "finish" && message.source === "agent";
