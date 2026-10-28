import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  CircleDollarSign,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  MessageCircle,
  Network,
  Wrench,
} from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useFeedDiffStats } from "#/hooks/query/use-feed-diff-stats";
import { useFeedUsage } from "#/hooks/query/use-feed-usage";
import { I18nKey } from "#/i18n/declaration";
import { getFeedMetadata } from "#/utils/feed-metadata";
import {
  getFeedGitActivity,
  isFeedTeamDemoEnabled,
} from "#/utils/feed-team-demo";
import { formatCompactCount } from "#/utils/feed-usage";
import { cn } from "#/utils/utils";

interface FeedStatsProps {
  conversation: AppConversation;
  inView: boolean;
  updateCount: number;
  actionCount: number;
  /** Whether the card's conversation accordion is open. */
  expanded: boolean;
  onToggle: () => void;
}

/** Activity counts, diff line numbers, tokens and context-window use. */
export function FeedStats({
  conversation,
  inView,
  updateCount,
  actionCount,
  expanded,
  onToggle,
}: FeedStatsProps) {
  const { t, i18n } = useTranslation("openhands");
  const diff = useFeedDiffStats(conversation, inView);
  const usage = useFeedUsage(conversation, inView);
  const compact = (value: number) => formatCompactCount(value, i18n.language);

  // Subagents, pull requests and cost are real when the backend reports them.
  // Commits and merges have no source yet, so they only appear as simulated
  // numbers in the team demo.
  const demo = isFeedTeamDemoEnabled(window.location.search);
  const simulated = getFeedGitActivity(conversation.id);
  const realSubagents = conversation.sub_conversation_ids?.length ?? 0;
  const realPullRequests = getFeedMetadata(conversation).pullRequests.length;
  const subagents = realSubagents || (demo ? simulated.subagents : 0);
  const pullRequests = realPullRequests || (demo ? simulated.pullRequests : 0);
  const commits = demo ? simulated.commits : 0;
  const merges = demo ? simulated.merges : 0;
  const cost = conversation.metrics?.accumulated_cost ?? 0;
  const formattedCost = new Intl.NumberFormat(i18n.language, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cost);

  return (
    <button
      type="button"
      data-testid="feed-card-stats"
      aria-expanded={expanded}
      aria-label={t(
        expanded
          ? I18nKey.FEED$CONVERSATION_HIDE
          : I18nKey.FEED$CONVERSATION_SHOW,
      )}
      onClick={onToggle}
      className="mt-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 border-y border-border px-4 py-2 text-left text-xs text-muted hover:bg-surface"
    >
      <span className="flex items-center gap-1.5">
        <MessageCircle size={14} />
        {t(I18nKey.FEED$STAT_UPDATES, { count: updateCount })}
      </span>
      <span className="flex items-center gap-1.5">
        <Wrench size={14} />
        {t(I18nKey.FEED$STAT_ACTIONS, { count: actionCount })}
      </span>
      {subagents > 0 ? (
        <span
          data-testid="feed-card-stat-subagents"
          title={t(I18nKey.FEED$STAT_SUBAGENTS, { count: subagents })}
          className="flex items-center gap-1.5"
        >
          <Network size={14} aria-hidden />
          {subagents}
        </span>
      ) : null}
      {cost > 0 ? (
        <span
          data-testid="feed-card-stat-cost"
          title={t(I18nKey.FEED$STAT_COST, { cost: formattedCost })}
          className="flex items-center gap-1.5"
        >
          <CircleDollarSign size={14} aria-hidden />
          {formattedCost}
        </span>
      ) : null}
      {diff.hasChanges ? (
        <span
          data-testid="feed-card-diff"
          className="flex items-center gap-1.5 font-mono"
        >
          <span className="text-success">{`+${compact(diff.additions)}${diff.isPartial ? "…" : ""}`}</span>
          <span className="text-danger">{`−${compact(diff.deletions)}${diff.isPartial ? "…" : ""}`}</span>
        </span>
      ) : null}
      {commits > 0 ? (
        <span
          data-testid="feed-card-stat-commits"
          title={t(I18nKey.FEED$STAT_COMMITS, { count: commits })}
          className="flex items-center gap-1.5"
        >
          <GitCommitHorizontal size={14} aria-hidden />
          {commits}
        </span>
      ) : null}
      {pullRequests > 0 ? (
        <span
          data-testid="feed-card-stat-prs"
          title={t(I18nKey.FEED$STAT_PRS, { count: pullRequests })}
          className="flex items-center gap-1.5"
        >
          <GitPullRequest size={14} aria-hidden />
          {pullRequests}
        </span>
      ) : null}
      {merges > 0 ? (
        <span
          data-testid="feed-card-stat-merges"
          title={t(I18nKey.FEED$STAT_MERGES, { count: merges })}
          className="flex items-center gap-1.5"
        >
          <GitMerge size={14} aria-hidden />
          {merges}
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
      <ChevronDown
        size={14}
        aria-hidden
        className={cn("ml-auto transition-transform", expanded && "rotate-180")}
      />
    </button>
  );
}
