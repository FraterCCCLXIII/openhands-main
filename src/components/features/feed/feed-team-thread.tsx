import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Network } from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { I18nKey } from "#/i18n/declaration";
import {
  useFeedRepliesStore,
  type FeedReply,
} from "#/stores/feed-replies-store";
import { getFeedAgent } from "#/utils/feed-agent";
import {
  FEED_ME_ID,
  FEED_TEAMMATES,
  feedProfilePath,
  getFeedPerson,
  getFeedMentionTargets,
  getFeedTeamThread,
  toMentionHandle,
  type FeedTeamAuthorKind,
  type FeedTeamMessage,
} from "#/utils/feed-team-demo";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { FeedAgentAvatar } from "./feed-agent-avatar";
import { FeedMentionText } from "./feed-mention-text";
import { FeedTeammateAvatar } from "./feed-teammate-avatar";
import { FeedThreadReplyBox } from "./feed-thread-reply-box";
import { FeedUserAvatar } from "./feed-user-avatar";

const KIND_LABEL: Record<FeedTeamAuthorKind, I18nKey> = {
  teammate: I18nKey.FEED$ROLE_TEAMMATE,
  agent: I18nKey.FEED$ROLE_AGENT,
  subagent: I18nKey.FEED$ROLE_SUBAGENT,
};

const SIMULATED_REPLY_DELAY_MS = 900;
const SIMULATED_ANSWERS = [
  "On it. I'll take a look now.",
  "Good point. I'll fold that in.",
  "Thanks for flagging. Checking.",
];

type ThreadMessage = FeedTeamMessage | FeedReply;

/** The person a message is attributed to: a teammate id, `you`, or none. */
const personIdOf = (message: ThreadMessage): string | null => {
  if ("personId" in message) return message.personId;
  return message.teammate?.id ?? null;
};

const teammateOf = (message: ThreadMessage) =>
  FEED_TEAMMATES.find((member) => member.id === personIdOf(message));

function MessageAvatar({
  message,
  conversation,
}: {
  message: ThreadMessage;
  conversation: AppConversation;
}) {
  const teammate = teammateOf(message);
  if (personIdOf(message) === FEED_ME_ID) return <FeedUserAvatar size={28} />;
  if (teammate) return <FeedTeammateAvatar teammate={teammate} size={28} />;
  if (message.kind === "agent") {
    return (
      <FeedAgentAvatar agent={getFeedAgent(conversation, true)} size={28} />
    );
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-muted">
      <Network size={14} aria-hidden />
    </span>
  );
}

interface ThreadNodeProps {
  message: ThreadMessage;
  conversation: AppConversation;
  storedReplies: FeedReply[];
  targets: ReturnType<typeof getFeedMentionTargets>;
  replyingTo: string | null;
  onReplyingTo: (id: string | null) => void;
  onSubmit: (parent: ThreadMessage, text: string) => void;
}

function ThreadNode({
  message,
  conversation,
  storedReplies,
  targets,
  replyingTo,
  onReplyingTo,
  onSubmit,
}: ThreadNodeProps) {
  const { t, i18n } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const personId = personIdOf(message);
  const isUser = personId === FEED_ME_ID;
  const replies: ThreadMessage[] = [
    ...("replies" in message ? message.replies : []),
    ...storedReplies.filter((reply) => reply.parentId === message.id),
  ];
  const authorLabel = isUser ? t(I18nKey.FEED$ROLE_YOU) : message.author;
  const isReplying = replyingTo === message.id;

  return (
    <li
      data-testid="feed-team-message"
      data-kind={message.kind}
      data-user={isUser ? "true" : undefined}
    >
      <div className="flex items-start gap-2">
        <MessageAvatar message={message} conversation={conversation} />
        <div className="min-w-0">
          <div className="rounded-2xl bg-surface px-3 py-2">
            <p className="flex flex-wrap items-center gap-x-2 text-xs">
              {personId && getFeedPerson(personId) ? (
                <NavigationLink
                  to={backendScopedPath(feedProfilePath(personId))}
                  data-testid="feed-team-author"
                  className="font-semibold text-contrast hover:underline"
                >
                  {authorLabel}
                </NavigationLink>
              ) : (
                <span className="font-semibold text-contrast">
                  {authorLabel}
                </span>
              )}
              {isUser ? null : (
                <span className="rounded-full bg-surface-raised px-1.5 py-0.5 text-[10px] text-muted">
                  {t(KIND_LABEL[message.kind])}
                </span>
              )}
              <span className="text-muted">
                {formatRelativeTime(message.timestamp, i18n.language, t)}
              </span>
            </p>
            <p className="mt-0.5 break-words text-sm text-contrast">
              <FeedMentionText text={message.text} />
            </p>
          </div>
          <button
            type="button"
            data-testid="feed-team-reply-button"
            aria-expanded={isReplying}
            onClick={() => onReplyingTo(isReplying ? null : message.id)}
            className="mt-1 px-3 text-xs font-medium text-muted hover:text-contrast"
          >
            {t(I18nKey.FEED$THREAD_REPLY)}
          </button>
          {isReplying ? (
            <FeedThreadReplyBox
              replyTo={{
                handle: isUser ? "You" : toMentionHandle(message.author),
                name: authorLabel,
              }}
              targets={targets}
              onSubmit={(text) => onSubmit(message, text)}
            />
          ) : null}
        </div>
      </div>
      {replies.length > 0 ? (
        <ul
          data-testid="feed-team-replies"
          className="ml-3.5 mt-2 flex flex-col gap-2 border-l border-border pl-4"
        >
          {replies.map((reply) => (
            <ThreadNode
              key={reply.id}
              message={reply}
              conversation={conversation}
              storedReplies={storedReplies}
              targets={targets}
              replyingTo={replyingTo}
              onReplyingTo={onReplyingTo}
              onSubmit={onSubmit}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/**
 * Simulated chatter between teammates, the agent and its subagents, as nested
 * replies. The user can reply to any message and @mention people; a mentioned
 * participant answers back, simulated. Replies live in the feed replies store,
 * so they survive a reload and show on the author's profile page.
 */
export function FeedTeamThread({
  conversation,
}: {
  conversation: AppConversation;
}) {
  const thread = getFeedTeamThread(conversation);
  const targets = getFeedMentionTargets(conversation.id);
  const allReplies = useFeedRepliesStore((state) => state.replies);
  const addReply = useFeedRepliesStore((state) => state.addReply);
  const storedReplies = allReplies.filter(
    (reply) => reply.conversationId === conversation.id,
  );
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  const handleSubmit = (parent: ThreadMessage, text: string) => {
    const now = Date.now();
    const userReply: FeedReply = {
      id: `${conversation.id}-you-${now}`,
      conversationId: conversation.id,
      parentId: parent.id,
      personId: FEED_ME_ID,
      author: "You",
      kind: "teammate",
      text,
      timestamp: new Date(now).toISOString(),
    };
    addReply(userReply);
    setReplyingTo(null);

    // The first person @mentioned answers back.
    const mentioned = [...text.matchAll(/@(\w+)/g)]
      .map(([, handle]) => targets.find((target) => target.handle === handle))
      .find((target) => target !== undefined);
    if (!mentioned) return;
    const timer = window.setTimeout(() => {
      const answeredAt = Date.now();
      addReply({
        id: `${userReply.id}-answer`,
        conversationId: conversation.id,
        parentId: userReply.id,
        personId:
          FEED_TEAMMATES.find((member) => member.name === mentioned.name)?.id ??
          mentioned.handle,
        author: mentioned.name,
        kind: mentioned.kind,
        text: `@You ${SIMULATED_ANSWERS[text.length % SIMULATED_ANSWERS.length]}`,
        timestamp: new Date(answeredAt).toISOString(),
      });
    }, SIMULATED_REPLY_DELAY_MS);
    timers.current.push(timer);
  };

  return (
    <ul
      data-testid="feed-team-thread"
      className="flex flex-col gap-3 border-t border-border pt-3"
    >
      {thread.map((message) => (
        <ThreadNode
          key={message.id}
          message={message}
          conversation={conversation}
          storedReplies={storedReplies}
          targets={targets}
          replyingTo={replyingTo}
          onReplyingTo={setReplyingTo}
          onSubmit={handleSubmit}
        />
      ))}
    </ul>
  );
}
