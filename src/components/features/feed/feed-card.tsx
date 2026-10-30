import { cn } from "#/utils/utils";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Loader2,
  Pin,
  Wrench,
} from "lucide-react";
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
import { useFeedConversation } from "#/hooks/query/use-feed-conversation";
import { useInView } from "#/hooks/use-in-view";
import { useIsVisible } from "#/hooks/use-is-visible";
import { useFeedLiveStream } from "#/hooks/use-feed-live-stream";
import { MarkdownRenderer } from "#/components/features/markdown/markdown-renderer";
import { ExecutionStatus } from "#/types/agent-server/core";
import { I18nKey } from "#/i18n/declaration";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { getFeedAgent, type FeedAgent } from "#/utils/feed-agent";
import { isFeedDemoAgentsEnabled } from "#/utils/feed-demo-agents";
import { FeedUserAvatar } from "./feed-user-avatar";
import { FeedRoleBadge } from "./feed-role-badge";
import { getFeedAgentRole } from "#/utils/feed-agent-role";
import { FeedAgentAvatar } from "./feed-agent-avatar";
import { TurnDetailsPanel } from "#/components/shared/turn-details-panel";
import { FeedTeamThread } from "./feed-team-thread";
import { isFeedTeamDemoEnabled } from "#/utils/feed-team-demo";
import {
  mergeFeedUpdates,
  type FeedUpdate,
  type FeedUpdateKind,
} from "#/utils/feed-updates";

const STREAMING_ID = "feed-streaming";
const OPTIMISTIC_PREFIX = "feed-optimistic-";

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
  streaming = false,
}: {
  update: FeedUpdate;
  agent: FeedAgent;
  /** The message is still being written: show a caret. */
  streaming?: boolean;
}) {
  const { t, i18n } = useTranslation("openhands");
  const author = update.kind === "agent" ? agent.name : null;
  const [showDetails, setShowDetails] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);
  // Keep the newest streamed words in view inside the bounded bubble.
  useEffect(() => {
    const el = textRef.current;
    if (streaming && el) el.scrollTop = el.scrollHeight;
  }, [streaming, update.text]);
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
        <div
          ref={textRef}
          data-testid="feed-update-text"
          className={cn(
            "mt-0.5 break-words text-sm text-contrast",
            streaming && "custom-scrollbar max-h-72 overflow-y-auto",
          )}
        >
          {update.kind === "agent" ? (
            <MarkdownRenderer includeStandard streaming={streaming}>
              {update.text}
            </MarkdownRenderer>
          ) : (
            update.text
          )}
          {streaming ? (
            <span
              aria-hidden
              data-testid="feed-stream-caret"
              className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-current motion-reduce:animate-none"
            />
          ) : null}
        </div>
        {update.details ? (
          <>
            <button
              type="button"
              data-testid="feed-update-details-toggle"
              aria-expanded={showDetails}
              onClick={() => setShowDetails((open) => !open)}
              className="mt-1 flex items-center gap-0.5 text-xs text-muted hover:text-contrast"
            >
              <ChevronRight
                size={12}
                aria-hidden
                className={showDetails ? "rotate-90" : undefined}
              />
              {t(
                showDetails
                  ? I18nKey.FEED$DETAILS_HIDE
                  : I18nKey.FEED$DETAILS_SHOW,
              )}
            </button>
            {showDetails ? <TurnDetailsPanel details={update.details} /> : null}
          </>
        ) : null}
      </div>
    </li>
  );
}

/** The accordion body: every update in the conversation, oldest first. */
function FeedFullConversation({
  conversation,
  agent,
}: {
  conversation: AppConversation;
  agent: FeedAgent;
}) {
  const { data: updates = [], isLoading } = useFeedConversation(
    conversation,
    true,
  );
  return (
    <ul
      data-testid="feed-card-conversation"
      className="custom-scrollbar flex max-h-[28rem] flex-col gap-3 overflow-y-auto border-b border-border px-4 py-3"
    >
      {isLoading
        ? null
        : updates.map((update) => (
            <FeedUpdateRow key={update.id} update={update} agent={agent} />
          ))}
    </ul>
  );
}

interface FeedCardProps {
  conversation: AppConversation;
}

/**
 * One conversation as a social-style post: the agent is the author, the
 * conversation title is the post, and recent activity reads as comments.
 */
function FeedCardView({ conversation }: FeedCardProps) {
  const { t, i18n } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const [expanded, setExpanded] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);
  const isLive = conversation.execution_status === ExecutionStatus.RUNNING;
  const visible = useIsVisible(ref);
  // Only a visible, running card holds a socket; others poll or sit idle.
  const live = useFeedLiveStream(conversation, isLive && visible);
  const { data: fetched = [], isLoading } = useFeedUpdates(
    conversation,
    inView,
    live.connected,
  );
  const [optimistic, setOptimistic] = useState<FeedUpdate[]>([]);
  const streamStartedAt = useRef<string | null>(null);
  if (live.streamingText === null) streamStartedAt.current = null;
  else streamStartedAt.current ??= new Date().toISOString();
  const updates = useMemo(() => {
    const merged = mergeFeedUpdates(fetched, live.updates);
    // A reply shows at once and gives way to the real message when it lands.
    const pending = optimistic.filter(
      (reply) =>
        !merged.some(
          (update) => update.kind === "user" && update.text === reply.text,
        ),
    );
    const streaming: FeedUpdate[] =
      live.streamingText && streamStartedAt.current
        ? [
            {
              id: STREAMING_ID,
              kind: "agent",
              timestamp: streamStartedAt.current,
              text: live.streamingText,
            },
          ]
        : [];
    return [...streaming, ...pending, ...merged];
  }, [fetched, live.updates, live.streamingText, optimistic]);

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
  const actionCount = updates.filter((u) => u.kind === "action").length;

  return (
    <article
      ref={ref}
      data-testid="feed-card"
      data-conversation-id={conversation.id}
      className="rounded-lg border border-border bg-surface-raised"
    >
      <header className="flex items-center gap-3 px-4 pt-3">
        <FeedAgentAvatar
          data-testid="feed-card-agent-avatar"
          agent={agent}
          size={40}
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
                className="rounded-full bg-success-soft px-2 py-0.5 text-xs font-normal text-success-soft-foreground"
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
        expanded={conversationOpen}
        onToggle={() => setConversationOpen((value) => !value)}
      />
      {conversationOpen ? (
        <FeedFullConversation conversation={conversation} agent={agent} />
      ) : null}
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
              <FeedUpdateRow
                update={latest}
                agent={agent}
                streaming={latest.id === STREAMING_ID}
              />
            </ul>
          ) : (
            <p className="text-sm text-muted">
              {isLoading || !inView ? "" : t(I18nKey.FEED$NO_UPDATES)}
            </p>
          )}
        </div>

        {isFeedTeamDemoEnabled(window.location.search) ? (
          <FeedTeamThread conversation={conversation} />
        ) : null}

        {isLive && live.streamingText === null ? (
          <p
            data-testid="feed-card-working"
            className="flex items-center gap-1.5 text-xs text-muted"
          >
            <Loader2
              size={12}
              aria-hidden
              className="animate-spin motion-reduce:animate-none"
            />
            {t(I18nKey.FEED$WORKING)}
          </p>
        ) : null}

        <FeedCardReply
          conversation={conversation}
          onOptimistic={(text) => {
            const handle = `${OPTIMISTIC_PREFIX}${Date.now()}`;
            setOptimistic((current) => [
              ...current,
              {
                id: handle,
                kind: "user",
                timestamp: new Date().toISOString(),
                text,
              },
            ]);
            return handle;
          }}
          onRevert={(handle) =>
            setOptimistic((current) =>
              current.filter((reply) => reply.id !== handle),
            )
          }
        />
      </div>
    </article>
  );
}

/** Memoised so one card's streamed tokens never re-render the others. */
export const FeedCard = memo(FeedCardView);
