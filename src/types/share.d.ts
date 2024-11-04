interface Config {
  action: "initialize";
  args: {
    AGENT: string;
    CONFIRMATION_MODE: boolean;
    LANGUAGE: string;
    LLM_API_KEY: string;
    LLM_MODEL: string;
  }
}

interface AgentStateChangeAction {
  id: number;
  message: string;
  source: "environment" | "agent";
  timestamp: string;
  action: "change_agent_state";
  args: {
    agent_state: "init" | "loading" | "running" | "awaiting_user_input" | "finished";
    thought: string;
  };
}

interface AgentStateChangeObservation {
  id: number;
  message: string;
  source: "environment" | "agent";
  timestamp: string;
  observation: "agent_state_changed";
  content: string;
  extras: {
    agent_state: "init" | "loading" | "running" | "awaiting_user_input" | "finished";
  };
}

type AgentStateChange = AgentStateChangeAction | AgentStateChangeObservation;

interface UserMessage {
  action: "message";
  source?: "user";
  content?: string;
  args?: {
    content: string;
    images_urls: string[];
  };
}

interface AssistantMessage {
  id: number;
  action: "message";
  message: string;
  source: "agent";
  timestamp: string; // ISO 8601
  content?: string;
  args?: {
    content: string;
    images_urls: string[] | null;
    wait_for_response: boolean;
  };
}

interface CommandAction {
  id: number;
  action: "run";
  message: string;
  source: "agent";
  timestamp: string;
  args: {
    command: string;
    is_confirmed: "confirmed";
    thought: string;
  };
}


interface NullObservation {
  id: number;
  cause: number;
  observation: "null";
  message: string;
  content: string;
  source: "environment" | "user";
  timestamp: string;
  extras: Record<string, unknown>;
}

interface CommandObservation {
  id: number;
  cause: number;
  observation: "run";
  message: string;
  content: string;
  source: "agent";
  timestamp: string;
  extras: {
    command: string;
    command_id: number;
    exit_code: number;
  };
}

interface IPythonAction {
  id: number;
  action: "run_ipython";
  message: string;
  source: "agent";
  timestamp: string;
  args: {
    code: string;
    is_confirmed: "confirmed";
    kernel_init_code: string;
    thought: string;
  };
}

interface IPythonObservation {
  id: number;
  cause: number;
  observation: "run_ipython";
  message: string;
  content: string;
  source: "agent";
  timestamp: string;
  extras: {
    code: string;
  };
}

interface FinishAction {
  id: number;
  message: string;
  source: "agent";
  timestamp: string;
  action: "finish";
  args: {
    outputs: Record<string, unknown>;
    thought: string;
  };
}

interface ErrorObservation {
  id: number;
  message: string;
  source: "agent";
  timestamp: string;
  observation: "error";
  content: string;
  extras: Record<string, unknown>;
}

type TrajectoryItem = AgentStateChange | UserMessage | AssistantMessage | CommandAction | CommandObservation | IPythonAction | IPythonObservation | FinishAction | Config | ErrorObservation | NullObservation;
