import { useQuery } from "@tanstack/react-query";
import AgentServerGitService from "#/api/git-service/agent-server-git-service.api";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { getGitPath } from "#/utils/get-git-path";
import { FEED_QUERY_KEYS } from "./query-keys";

/**
 * Files the agent has changed in a conversation's workspace, for the feed
 * card's diff summary. Skipped when there is no workspace to diff or the
 * runtime isn't up (a paused or missing cloud sandbox would only error).
 */
export const useFeedChanges = (
  conversation: AppConversation,
  enabled: boolean,
) => {
  const workingDir = conversation.workspace?.working_dir?.trim();
  const hasWorkspace = !!conversation.selected_repository || !!workingDir;
  const runtimeUp =
    !conversation.sandbox_status || conversation.sandbox_status === "RUNNING";
  const gitPath = getGitPath(conversation.selected_repository, workingDir);

  return useQuery({
    queryKey: FEED_QUERY_KEYS.changes(
      conversation.id,
      conversation.updated_at,
      conversation.conversation_url,
      conversation.session_api_key,
      gitPath,
    ),
    enabled: enabled && hasWorkspace && runtimeUp,
    queryFn: () =>
      AgentServerGitService.getGitChanges(
        conversation.id,
        conversation.conversation_url,
        conversation.session_api_key,
        gitPath,
      ),
    retry: false,
    staleTime: 60_000,
    meta: { disableToast: true },
  });
};
