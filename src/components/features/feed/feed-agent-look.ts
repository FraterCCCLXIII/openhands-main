import { ExecutionStatus } from "#/types/agent-server/core/base/common";
import type {
  KamijiAnimation,
  KamijiExpression,
} from "#/components/features/kamiji/kamiji-expressions";

export interface FeedAgentLook {
  expression: KamijiExpression;
  animation: KamijiAnimation;
}

const NEUTRAL_LOOK: FeedAgentLook = {
  expression: "neutral",
  animation: "Idle",
};

const LOOK_BY_STATUS: Partial<Record<ExecutionStatus, FeedAgentLook>> = {
  [ExecutionStatus.RUNNING]: { expression: "thinking", animation: "Think" },
  [ExecutionStatus.FINISHED]: { expression: "happy", animation: "Idle" },
  [ExecutionStatus.WAITING_FOR_CONFIRMATION]: {
    expression: "surprised",
    animation: "Idle",
  },
  [ExecutionStatus.PAUSED]: { expression: "sleepy", animation: "Idle" },
  [ExecutionStatus.ERROR]: { expression: "sad", animation: "Idle" },
  [ExecutionStatus.STUCK]: { expression: "sad", animation: "Idle" },
};

/** How a feed agent's Kamiji looks for a conversation's execution status. */
export function getFeedAgentLook(
  status?: ExecutionStatus | null,
): FeedAgentLook {
  return (status && LOOK_BY_STATUS[status]) || NEUTRAL_LOOK;
}
