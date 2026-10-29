import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { ExecutionStatus } from "#/types/agent-server/core";
import type { PipelineCountKind } from "./pipeline-templates";

/** The live figures a pipeline step can show, from a factory's conversations. */
export function pipelineCounts(
  conversations: AppConversation[],
): Record<PipelineCountKind, number> {
  return {
    conversations: conversations.length,
    live: conversations.filter(
      (c) => c.execution_status === ExecutionStatus.RUNNING,
    ).length,
    prs: conversations.filter((c) => (c.pr_number?.length ?? 0) > 0).length,
  };
}
