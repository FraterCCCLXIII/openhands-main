import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight } from "lucide-react";
import { KamijiLookBadge } from "#/components/features/kamiji/kamiji-look-avatar";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { ConversationStatusDot } from "#/components/features/conversation-panel/conversation-status-dot";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useFeedSubagents } from "#/hooks/query/use-feed-subagents";
import { I18nKey } from "#/i18n/declaration";
import { orderSubagentTree, summarizeSubagents } from "#/utils/feed-subagents";

interface FeedSubagentsProps {
  conversation: AppConversation;
  inView: boolean;
}

/**
 * Shown when a conversation manages subagents: how many it manages directly,
 * the total across their own subagents, and an expandable tree of them.
 */
export function FeedSubagents({ conversation, inView }: FeedSubagentsProps) {
  const { t, i18n } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const [expanded, setExpanded] = useState(false);
  const directCount = conversation.sub_conversation_ids?.length ?? 0;
  const { data: nodes = [] } = useFeedSubagents(conversation, inView);

  if (directCount === 0) return null;

  const { total, levels, running } = summarizeSubagents(nodes);
  const rows = orderSubagentTree(nodes, conversation.id);

  return (
    <div
      data-testid="feed-card-subagents"
      className="border-b border-border px-4 py-2 text-xs text-muted"
    >
      <button
        type="button"
        data-testid="feed-card-subagents-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left hover:text-contrast"
      >
        <KamijiLookBadge look="ref:subagents" size={18} />
        <span className="font-medium text-contrast">
          {t(I18nKey.FEED$SUBAGENTS_MANAGING, { count: directCount })}
        </span>
        {total > directCount ? (
          <span>{t(I18nKey.FEED$SUBAGENTS_NESTED, { total, levels })}</span>
        ) : null}
        {running > 0 ? (
          <span className="text-success">
            {t(I18nKey.FEED$SUBAGENTS_RUNNING, { count: running })}
          </span>
        ) : null}
        <span className="ml-auto flex items-center gap-1">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {t(
            expanded
              ? I18nKey.FEED$SUBAGENTS_HIDE
              : I18nKey.FEED$SUBAGENTS_SHOW,
          )}
        </span>
      </button>
      {expanded && rows.length > 0 ? (
        <ul
          data-testid="feed-card-subagent-list"
          className="mt-2 flex flex-col gap-1"
        >
          {rows.map(({ conversation: child, depth }) => (
            <li
              key={child.id}
              data-testid="feed-card-subagent"
              data-depth={depth}
              className="flex items-center gap-2"
              ref={(el) => {
                el?.style.setProperty("padding-left", `${(depth - 1) * 16}px`);
              }}
            >
              <ConversationStatusDot
                executionStatus={child.execution_status}
                sandboxStatus={child.sandbox_status}
              />
              <NavigationLink
                to={backendScopedPath(`/conversations/${child.id}`)}
                className="min-w-0 flex-1 truncate text-contrast hover:underline"
              >
                {child.title || t(I18nKey.FEED$UNTITLED)}
              </NavigationLink>
              <span className="shrink-0">
                {new Date(child.updated_at).toLocaleTimeString(i18n.language, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
