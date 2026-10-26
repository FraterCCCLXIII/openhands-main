import type { ExecutionStatus } from "#/types/agent-server/core/base/common";
import {
  getKamijiLook,
  statusLookKey,
} from "#/components/features/kamiji/kamiji-look";
import type {
  KamijiAnimation,
  KamijiExpression,
} from "#/components/features/kamiji/kamiji-expressions";

export interface FeedAgentLook {
  expression: KamijiExpression;
  animation: KamijiAnimation;
}

/** How a feed agent's Kamiji looks for a conversation's execution status. */
export function getFeedAgentLook(
  status?: ExecutionStatus | null,
): FeedAgentLook {
  const { expression, animation } = getKamijiLook(statusLookKey(status));
  return { expression, animation };
}
