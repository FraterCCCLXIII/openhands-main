import { useTranslation } from "react-i18next";
import { Bot } from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { I18nKey } from "#/i18n/declaration";
import { useConversationDiffStatsStore } from "#/stores/conversation-diff-stats-store";
import { ExecutionStatus } from "#/types/agent-server/core";
import { formatCompactCount } from "#/utils/feed-usage";
import { cn } from "#/utils/utils";

/**
 * Real line totals and running agents for the conversations behind a list row.
 * Diff totals are the last ones the app saw for each conversation (a diff needs
 * a running workspace), so the numbers are left out until at least one
 * conversation in the group has reported them.
 */
export function FeedRowStats({
  conversations,
}: {
  conversations: AppConversation[];
}) {
  const { t, i18n } = useTranslation("openhands");
  const totalsById = useConversationDiffStatsStore(
    (state) => state.diffTotalsByConversationId,
  );
  const known = conversations
    .map((conversation) => totalsById[conversation.id])
    .filter((totals) => totals !== undefined);
  const additions = known.reduce((sum, totals) => sum + totals.additions, 0);
  const deletions = known.reduce((sum, totals) => sum + totals.deletions, 0);
  const activeAgents = conversations.filter(
    (conversation) => conversation.execution_status === ExecutionStatus.RUNNING,
  ).length;
  const compact = (value: number) => formatCompactCount(value, i18n.language);

  return (
    <span
      data-testid="feed-row-stats"
      className="flex items-center gap-3 text-xs"
    >
      {known.length > 0 ? (
        <span data-testid="feed-row-diff" className="flex gap-1.5 font-mono">
          <span className="text-success">{`+${compact(additions)}`}</span>
          <span className="text-danger">{`−${compact(deletions)}`}</span>
        </span>
      ) : null}
      <span
        data-testid="feed-row-active"
        title={t(I18nKey.FEED$ROW_AGENTS_ACTIVE, { count: activeAgents })}
        className={cn(
          "flex items-center gap-1",
          activeAgents > 0 ? "text-success" : "text-muted",
        )}
      >
        <Bot size={12} aria-hidden />
        {activeAgents}
      </span>
    </span>
  );
}
