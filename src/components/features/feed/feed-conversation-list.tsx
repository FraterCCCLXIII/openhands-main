import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import type { Provider } from "#/types/settings";
import { ConversationCard } from "#/components/features/conversation-panel/conversation-card/conversation-card";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import {
  feedConversationPath,
  useOpenFeedConversation,
} from "#/hooks/use-open-feed-conversation";
import { useFactoryResolver } from "#/hooks/use-feed-factories";
import { I18nKey } from "#/i18n/declaration";
import { useArchivedConversationsStore } from "#/stores/archived-conversations-store";
import { useConversationDiffStatsStore } from "#/stores/conversation-diff-stats-store";
import { isEffectivelyArchivedConversation } from "#/utils/conversation-archive-status";
import { filterConversationsByQuery } from "#/utils/conversation-search-filter";
import { matchesFeedFilter, type FeedFilter } from "#/utils/feed-filters";
import { cn } from "#/utils/utils";

interface FeedConversationListProps {
  /** Every loaded conversation; the list narrows them by the feed filter. */
  conversations: AppConversation[];
  filter: FeedFilter;
}

/**
 * The conversations behind the feed's current factory, project and agent
 * filters, as the same rows the main sidebar shows (status dot, title, time,
 * line totals), with a search box. Archived conversations are left out.
 * Picking a row opens that conversation inside Tower (`/feed?conversation=`).
 */
export function FeedConversationList({
  conversations,
  filter,
}: FeedConversationListProps) {
  const { t } = useTranslation("openhands");
  const [query, setQuery] = useState("");
  const resolveFactory = useFactoryResolver();
  const backendScopedPath = useBackendScopedPath();
  const { openConversationId: currentId } = useOpenFeedConversation();
  const { backend } = useActiveBackend();
  const archivedIds = useArchivedConversationsStore(
    (state) => state.archivesByBackendId[backend.id],
  );
  const diffTotals = useConversationDiffStatsStore(
    (state) => state.diffTotalsByConversationId,
  );

  const rows = useMemo(() => {
    const archived = new Set(archivedIds);
    const shown = conversations.filter(
      (c) =>
        !isEffectivelyArchivedConversation(
          c.sandbox_status,
          archived.has(c.id),
        ) && matchesFeedFilter(c, filter, resolveFactory),
    );
    return filterConversationsByQuery(shown, query);
  }, [conversations, archivedIds, filter, resolveFactory, query]);

  return (
    <section data-testid="feed-conversation-list">
      <h2 className="mb-1 px-2 text-[17px] font-semibold text-muted">
        {t(I18nKey.FEED$CONVERSATIONS)}
      </h2>
      <label className="relative mb-1 block px-2">
        <Search
          size={14}
          aria-hidden
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="search"
          data-testid="feed-conversation-search"
          aria-label={t(I18nKey.FEED$CONVERSATIONS_SEARCH)}
          placeholder={t(I18nKey.FEED$CONVERSATIONS_SEARCH)}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-md border border-border bg-transparent py-1.5 pl-8 pr-2 text-sm text-contrast placeholder:text-muted"
        />
      </label>
      {rows.length === 0 ? (
        <p
          data-testid="feed-conversation-list-empty"
          className="px-2 pt-1 text-sm text-muted"
        >
          {t(I18nKey.FEED$CONVERSATIONS_EMPTY)}
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {rows.map((conversation) => (
            <li key={conversation.id} data-testid="feed-conversation-row">
              <NavigationLink
                to={backendScopedPath(feedConversationPath(conversation.id))}
                aria-current={
                  conversation.id === currentId ? "true" : undefined
                }
                className={cn(
                  "block rounded-md transition-colors hover:bg-surface",
                  conversation.id === currentId && "bg-surface",
                )}
              >
                <ConversationCard
                  title={conversation.title ?? ""}
                  selectedRepository={{
                    selected_repository: conversation.selected_repository,
                    selected_branch: conversation.selected_branch,
                    git_provider: conversation.git_provider as Provider,
                  }}
                  lastUpdatedAt={conversation.updated_at}
                  createdAt={conversation.created_at}
                  executionStatus={conversation.execution_status}
                  sandboxStatus={conversation.sandbox_status}
                  conversationId={conversation.id}
                  isActive={conversation.id === currentId}
                  workspaceWorkingDir={
                    conversation.selected_workspace ??
                    conversation.workspace?.working_dir
                  }
                  llmModel={conversation.llm_model}
                  agentKind={conversation.agent_kind}
                  acpServer={conversation.acp_server}
                  tags={conversation.tags}
                  diffStats={diffTotals[conversation.id] ?? null}
                />
              </NavigationLink>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
