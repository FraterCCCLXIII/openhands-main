import { useTranslation } from "react-i18next";
import { Bot } from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { I18nKey } from "#/i18n/declaration";
import { summarizeFeedGroup } from "#/utils/feed-team-demo";
import { formatCompactCount } from "#/utils/feed-usage";
import { cn } from "#/utils/utils";

/** Diff numbers and running agents for the conversations behind a list row. */
export function FeedRowStats({
  conversations,
}: {
  conversations: AppConversation[];
}) {
  const { t, i18n } = useTranslation("openhands");
  const { additions, deletions, activeAgents } =
    summarizeFeedGroup(conversations);
  const compact = (value: number) => formatCompactCount(value, i18n.language);

  return (
    <span
      data-testid="feed-row-stats"
      className="flex items-center gap-3 text-xs"
    >
      <span data-testid="feed-row-diff" className="flex gap-1.5 font-mono">
        <span className="text-success">{`+${compact(additions)}`}</span>
        <span className="text-danger">{`−${compact(deletions)}`}</span>
      </span>
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
