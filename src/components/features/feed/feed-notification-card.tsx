import { useRef } from "react";
import { useTranslation } from "react-i18next";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useFeedUpdates } from "#/hooks/query/use-feed-updates";
import { useInView } from "#/hooks/use-in-view";
import { I18nKey } from "#/i18n/declaration";
import { getFeedAgent } from "#/utils/feed-agent";
import { isFeedDemoAgentsEnabled } from "#/utils/feed-demo-agents";
import {
  getFeedNotificationKind,
  type FeedNotificationKind,
} from "#/utils/feed-notifications";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { cn } from "#/utils/utils";
import { getFeedAgentRole } from "#/utils/feed-agent-role";
import { FeedRoleBadge } from "./feed-role-badge";
import { FeedAgentAvatar } from "./feed-agent-avatar";

const KIND_LABEL: Record<FeedNotificationKind, I18nKey> = {
  needs_input: I18nKey.FEED$NOTIFY_NEEDS_INPUT,
  error: I18nKey.FEED$NOTIFY_ERROR,
  finished: I18nKey.FEED$NOTIFY_FINISHED,
  working: I18nKey.FEED$NOTIFY_WORKING,
  paused: I18nKey.FEED$NOTIFY_PAUSED,
  idle: I18nKey.FEED$NOTIFY_IDLE,
};

const KIND_ACCENT: Record<FeedNotificationKind, string> = {
  needs_input: "border-l-contrast",
  error: "border-l-danger",
  finished: "border-l-success",
  working: "border-l-success/50",
  paused: "border-l-border",
  idle: "border-l-border",
};

const KIND_LABEL_COLOR: Record<FeedNotificationKind, string> = {
  needs_input: "text-contrast",
  error: "text-danger",
  finished: "text-success",
  working: "text-success",
  paused: "text-muted",
  idle: "text-muted",
};

/** A conversation as a compact notification: what happened, where, and a way in. */
export function FeedNotificationCard({
  conversation,
}: {
  conversation: AppConversation;
}) {
  const { t, i18n } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const { data: updates = [] } = useFeedUpdates(conversation, inView);
  const agent = getFeedAgent(
    conversation,
    isFeedDemoAgentsEnabled(window.location.search),
  );
  const kind = getFeedNotificationKind(conversation.execution_status);
  const [latest] = updates;

  return (
    <article
      ref={ref}
      data-testid="feed-notification"
      data-kind={kind}
      className={cn(
        "flex items-start gap-3 rounded-xl border border-l-4 border-border bg-surface-raised p-3",
        KIND_ACCENT[kind],
      )}
    >
      <FeedAgentAvatar agent={agent} size={36} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-muted">
          <span
            data-testid="feed-notification-status"
            className={cn("font-semibold", KIND_LABEL_COLOR[kind])}
          >
            {t(KIND_LABEL[kind])}
          </span>
          <span>{agent.name}</span>
          <FeedRoleBadge role={getFeedAgentRole(conversation, agent.demo)} />
          <span>
            {formatRelativeTime(conversation.updated_at, i18n.language, t)}
          </span>
        </p>
        <NavigationLink
          to={backendScopedPath(`/conversations/${conversation.id}`)}
          className="mt-0.5 block truncate text-sm font-medium text-contrast hover:underline"
        >
          {conversation.title || t(I18nKey.FEED$UNTITLED)}
        </NavigationLink>
        {latest ? (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">
            {latest.text}
          </p>
        ) : null}
      </div>
      <NavigationLink
        to={backendScopedPath(`/conversations/${conversation.id}`)}
        className="shrink-0 rounded-lg bg-surface px-3 py-1.5 text-xs font-medium text-contrast hover:opacity-80"
      >
        {t(I18nKey.FEED$OPEN_SHORT)}
      </NavigationLink>
    </article>
  );
}
