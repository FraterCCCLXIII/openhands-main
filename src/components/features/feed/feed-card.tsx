import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, ExternalLink, Pin, Wrench } from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { NavigationLink } from "#/components/shared/navigation-link";
import { FeedCardMenu } from "./feed-card-menu";
import { FeedCardReply } from "./feed-card-reply";
import { FeedMetadata, FeedRefBubbles } from "./feed-metadata";
import { FeedSubagents } from "./feed-subagents";
import { FeedStats } from "./feed-stats";
import { ConversationStatusDot } from "#/components/features/conversation-panel/conversation-status-dot";
import { useFeedConversationFlags } from "#/hooks/use-feed-conversation-flags";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useFeedUpdates } from "#/hooks/query/use-feed-updates";
import { useInView } from "#/hooks/use-in-view";
import { ExecutionStatus } from "#/types/agent-server/core";
import { I18nKey } from "#/i18n/declaration";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { getFeedAgent, type FeedAgent } from "#/utils/feed-agent";
import { isFeedDemoAgentsEnabled } from "#/utils/feed-demo-agents";
import { FeedUserAvatar } from "./feed-user-avatar";
import { FeedRoleBadge } from "./feed-role-badge";
import { getFeedAgentRole } from "#/utils/feed-agent-role";
import { FeedAgentAvatar } from "./feed-agent-avatar";
import type { FeedUpdate, FeedUpdateKind } from "#/utils/feed-updates";

const KIND_LABEL: Record<FeedUpdateKind, I18nKey> = {
  user: I18nKey.FEED$ROLE_YOU,
  agent: I18nKey.FEED$ROLE_AGENT,
  action: I18nKey.FEED$ROLE_TOOL,
  error: I18nKey.FEED$ROLE_ERROR,
};

const AVATAR_CLASS =
  "flex shrink-0 items-center justify-center rounded-full bg-surface text-contrast";

function UpdateAvatar({
  update,
  agent,
}: {
  update: FeedUpdate;
  agent: FeedAgent;
}) {
  let glyph;
  if (update.kind === "agent") {
    return <FeedAgentAvatar agent={agent} size={32} />;
  } else if (update.kind === "action") {
    glyph = <Wrench size={14} />;
  } else if (update.kind === "error") {
    glyph = <AlertCircle size={14} className="text-danger" />;
  } else {
    return <FeedUserAvatar />;
  }
  return <span className={`${AVATAR_CLASS} size-8`}>{glyph}</span>;
}

function FeedUpdateRow({
  update,
  agent,
}: {
  update: FeedUpdate;
  agent: FeedAgent;
}) {
  const { t, i18n } = useTranslation("openhands");
  const author = update.kind === "agent" ? agent.name : null;
  return (
    <li
      data-testid="feed-update"
      data-kind={update.kind}
      className="flex items-start gap-2"
    >
      <UpdateAvatar update={update} agent={agent} />
      <div className="min-w-0 rounded-2xl bg-surface px-3 py-2">
        <p className="text-xs">
          <span className="font-semibold text-contrast">
            {author ?? t(KIND_LABEL[update.kind])}
          </span>
          <span className="ml-2 text-muted">
            {formatRelativeTime(update.timestamp, i18n.language, t)}
          </span>
        </p>
        <p className="mt-0.5 break-words text-sm text-contrast">
          {update.text}
        </p>
      </div>
    </li>
  );
}

interface FeedCardProps {
  conversation: AppConversation;
}

/**
 * One conversation as a social-style post: the agent is the author, the
 * conversation title is the post, and recent activity reads as comments.
 */
export function FeedCard({ conversation }: FeedCardProps) {
  const { t, i18n } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const [expanded, setExpanded] = useState(false);
  const { data: updates = [], isLoading } = useFeedUpdates(
    conversation,
    inView,
  );

  const { isPinned } = useFeedConversationFlags(conversation.id);
  const agent = getFeedAgent(
    conversation,
    isFeedDemoAgentsEnabled(window.location.search),
  );
  const agentRole = getFeedAgentRole(conversation, agent.demo);
  const conversationPath = backendScopedPath(
    `/conversations/${conversation.id}`,
  );
  const [latest, ...earlier] = updates;
  const isLive = conversation.execution_status === ExecutionStatus.RUNNING;
  const actionCount = updates.filter((u) => u.kind === "action").length;

  return (
    <article
      ref={ref}
      data-testid="feed-card"
      data-conversation-id={conversation.id}
      className="rounded-xl border border-border bg-surface-raised"
    >
      <header className="flex items-center gap-3 px-4 pt-4">
        <FeedAgentAvatar
          data-testid="feed-card-agent-avatar"
          agent={agent}
          size={40}
          status={conversation.execution_status}
        />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-contrast">
            <span data-testid="feed-card-agent-name" className="truncate">
              {agent.name}
            </span>
            <FeedRoleBadge role={agentRole} />
            {isPinned ? (
              <Pin
                size={12}
                data-testid="feed-card-pinned"
                aria-label={t(I18nKey.CONVERSATION_PANEL$PINNED)}
                className="text-muted"
              />
            ) : null}
            {isLive ? (
              <span
                data-testid="feed-card-live"
                className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-normal text-success"
              >
                {t(I18nKey.FEED$LIVE)}
              </span>
            ) : null}
          </p>
          <p className="flex items-center gap-1.5 truncate text-xs text-muted">
            <ConversationStatusDot
              executionStatus={conversation.execution_status}
              sandboxStatus={conversation.sandbox_status}
            />
            <span className="truncate">
              {formatRelativeTime(conversation.updated_at, i18n.language, t)}
            </span>
          </p>
        </div>
        <FeedRefBubbles conversation={conversation} />
        <NavigationLink
          to={conversationPath}
          aria-label={t(I18nKey.FEED$OPEN)}
          title={t(I18nKey.FEED$OPEN)}
          className="rounded-full p-2 text-muted hover:bg-surface hover:text-contrast"
        >
          <ExternalLink size={16} />
        </NavigationLink>
        <FeedCardMenu conversation={conversation} />
      </header>

      <NavigationLink
        to={conversationPath}
        className="mt-3 block px-4 text-base text-contrast hover:underline"
      >
        {conversation.title || t(I18nKey.FEED$UNTITLED)}
      </NavigationLink>

      <FeedMetadata conversation={conversation} inView={inView} />

      <FeedStats
        conversation={conversation}
        inView={inView}
        updateCount={updates.length}
        actionCount={actionCount}
      />
      <FeedSubagents conversation={conversation} inView={inView} />

      <div className="flex flex-col gap-3 px-4 py-3">
        {expanded && earlier.length > 0 ? (
          <ul data-testid="feed-card-updates" className="flex flex-col gap-3">
            {[...earlier].reverse().map((update) => (
              <FeedUpdateRow key={update.id} update={update} agent={agent} />
            ))}
          </ul>
        ) : null}

        {earlier.length > 0 ? (
          <button
            type="button"
            data-testid="feed-card-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            className="self-start text-sm font-medium text-muted hover:text-contrast"
          >
            {expanded
              ? t(I18nKey.FEED$HIDE_UPDATES)
              : t(I18nKey.FEED$SHOW_UPDATES, { count: earlier.length })}
          </button>
        ) : null}

        <div data-testid="feed-card-preview">
          {latest ? (
            <ul>
              <FeedUpdateRow update={latest} agent={agent} />
            </ul>
          ) : (
            <p className="text-sm text-muted">
              {isLoading || !inView ? "" : t(I18nKey.FEED$NO_UPDATES)}
            </p>
          )}
        </div>

        <FeedCardReply conversation={conversation} />
      </div>
    </article>
  );
}
