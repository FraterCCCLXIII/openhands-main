import { useTranslation } from "react-i18next";
import { MessageCircle, Wrench } from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useFeedDiffStats } from "#/hooks/query/use-feed-diff-stats";
import { useFeedUsage } from "#/hooks/query/use-feed-usage";
import { I18nKey } from "#/i18n/declaration";
import { formatCompactCount } from "#/utils/feed-usage";

interface FeedStatsProps {
  conversation: AppConversation;
  inView: boolean;
  updateCount: number;
  actionCount: number;
}

/** Activity counts, diff line numbers, tokens and context-window use. */
export function FeedStats({
  conversation,
  inView,
  updateCount,
  actionCount,
}: FeedStatsProps) {
  const { t, i18n } = useTranslation("openhands");
  const diff = useFeedDiffStats(conversation, inView);
  const usage = useFeedUsage(conversation, inView);
  const compact = (value: number) => formatCompactCount(value, i18n.language);

  return (
    <div
      data-testid="feed-card-stats"
      className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-border px-4 py-2 text-xs text-muted"
    >
      <span className="flex items-center gap-1.5">
        <MessageCircle size={14} />
        {t(I18nKey.FEED$STAT_UPDATES, { count: updateCount })}
      </span>
      <span className="flex items-center gap-1.5">
        <Wrench size={14} />
        {t(I18nKey.FEED$STAT_ACTIONS, { count: actionCount })}
      </span>
      {diff.hasChanges ? (
        <span
          data-testid="feed-card-diff"
          className="flex items-center gap-1.5 font-mono"
        >
          <span className="text-success">{`+${compact(diff.additions)}${diff.isPartial ? "…" : ""}`}</span>
          <span className="text-danger">{`−${compact(diff.deletions)}${diff.isPartial ? "…" : ""}`}</span>
        </span>
      ) : null}
      {usage && usage.totalTokens > 0 ? (
        <span data-testid="feed-card-tokens">
          {t(I18nKey.FEED$STAT_TOKENS, { count: compact(usage.totalTokens) })}
        </span>
      ) : null}
      {usage && usage.contextPercent !== null ? (
        <span
          data-testid="feed-card-context"
          className="flex items-center gap-1.5"
          title={t(I18nKey.FEED$STAT_CONTEXT, {
            percent: usage.contextPercent,
            size: compact(usage.contextWindow),
          })}
        >
          <span
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={usage.contextPercent}
            aria-label={t(I18nKey.FEED$STAT_CONTEXT, {
              percent: usage.contextPercent,
              size: compact(usage.contextWindow),
            })}
            className="h-1.5 w-16 overflow-hidden rounded-full bg-surface"
          >
            <span
              className="block h-full bg-contrast"
              ref={(el) => {
                el?.style.setProperty("width", `${usage.contextPercent}%`);
              }}
            />
          </span>
          {t(I18nKey.FEED$STAT_CONTEXT, {
            percent: usage.contextPercent,
            size: compact(usage.contextWindow),
          })}
        </span>
      ) : null}
    </div>
  );
}
