import { useQueries } from "@tanstack/react-query";
import AgentServerGitService from "#/api/git-service/agent-server-git-service.api";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { getGitPath } from "#/utils/get-git-path";
import {
  countGitChangeDiffStats,
  sumGitDiffLineStats,
} from "#/utils/git-diff-stats";
import { FEED_QUERY_KEYS } from "./query-keys";
import { useFeedChanges } from "./use-feed-changes";

// A feed shows many cards, so cap the per-file diff requests behind each one.
// Beyond the cap the totals are a lower bound (`isPartial`).
const FEED_DIFF_FILE_LIMIT = 10;

/** Lines added and removed across a conversation's changed files. */
export const useFeedDiffStats = (
  conversation: AppConversation,
  enabled: boolean,
) => {
  const { data: changes } = useFeedChanges(conversation, enabled);
  const gitPath = getGitPath(
    conversation.selected_repository,
    conversation.workspace?.working_dir?.trim(),
  );
  const candidates = (Array.isArray(changes) ? changes : []).filter(
    (change) => change.status !== "D" && !!change.path,
  );
  const files = candidates.slice(0, FEED_DIFF_FILE_LIMIT);

  const queries = useQueries({
    queries: files.map((change) => ({
      queryKey: FEED_QUERY_KEYS.diff(
        conversation.id,
        conversation.updated_at,
        conversation.conversation_url,
        conversation.session_api_key,
        gitPath,
        change.path,
      ),
      queryFn: () =>
        AgentServerGitService.getGitChangeDiff(
          conversation.id,
          conversation.conversation_url,
          conversation.session_api_key,
          `${gitPath}/${change.path}`,
        ),
      staleTime: 60_000,
      retry: false,
      meta: { disableToast: true },
    })),
  });

  const totals = sumGitDiffLineStats(
    queries.flatMap((query) =>
      query.data ? [countGitChangeDiffStats(query.data)] : [],
    ),
  );

  return {
    ...totals,
    hasChanges: candidates.length > 0,
    isPartial: candidates.length > FEED_DIFF_FILE_LIMIT,
  };
};
