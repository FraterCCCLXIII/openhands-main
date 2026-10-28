import { useMemo } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useFeedConversations } from "#/hooks/use-feed-conversations";
import { I18nKey } from "#/i18n/declaration";
import { useFeedRepliesStore } from "#/stores/feed-replies-store";
import {
  flattenFeedThread,
  getFeedPerson,
  getFeedTeamThread,
} from "#/utils/feed-team-demo";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { FeedColumns } from "./feed-columns";
import { FeedMentionText } from "./feed-mention-text";
import { FeedTeammateAvatar } from "./feed-teammate-avatar";
import { FeedUserAvatar } from "./feed-user-avatar";

interface ProfileMessage {
  id: string;
  text: string;
  timestamp: string;
  conversationId: string;
  conversationTitle: string | null;
}

/**
 * A person's profile: who they are and every message they wrote across the
 * feed, newest first. Every teammate has one, and so does the user.
 */
export function FeedProfile() {
  const { t, i18n } = useTranslation("openhands");
  const { personId = "" } = useParams();
  const backendScopedPath = useBackendScopedPath();
  const person = getFeedPerson(personId);
  const { conversations } = useFeedConversations();
  const storedReplies = useFeedRepliesStore((state) => state.replies);

  const messages = useMemo(() => {
    const titleOf = (id: string) =>
      conversations.find((conversation) => conversation.id === id)?.title ??
      null;
    const simulated = conversations.flatMap((conversation) =>
      flattenFeedThread(getFeedTeamThread(conversation))
        .filter((message) => message.teammate?.id === personId)
        .map((message) => ({
          id: message.id,
          text: message.text,
          timestamp: message.timestamp,
          conversationId: conversation.id,
          conversationTitle: conversation.title ?? null,
        })),
    );
    const written = storedReplies
      .filter((reply) => reply.personId === personId)
      .map((reply) => ({
        id: reply.id,
        text: reply.text,
        timestamp: reply.timestamp,
        conversationId: reply.conversationId,
        conversationTitle: titleOf(reply.conversationId),
      }));
    return [...simulated, ...written].sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp),
    ) satisfies ProfileMessage[];
  }, [conversations, storedReplies, personId]);

  const teammate = person && !person.isMe ? person : null;
  const name = person?.isMe ? t(I18nKey.FEED$ROLE_YOU) : person?.name;

  return (
    <FeedColumns openFeedOnFilter>
      <div className="custom-scrollbar h-full overflow-y-auto px-4 py-4">
        <div className="mx-auto flex w-full max-w-[680px] flex-col gap-4">
          <NavigationLink
            to={backendScopedPath("/feed")}
            data-testid="feed-profile-back"
            className="flex items-center gap-1.5 self-start text-sm text-muted hover:text-contrast"
          >
            <ArrowLeft size={14} aria-hidden />
            {t(I18nKey.FEED$PROFILE_BACK)}
          </NavigationLink>

          {person ? (
            <>
              <header
                data-testid="feed-profile-header"
                className="flex items-center gap-4 rounded-lg bg-surface-raised p-4"
              >
                {teammate ? (
                  <FeedTeammateAvatar teammate={teammate} size={80} />
                ) : (
                  <FeedUserAvatar size={80} />
                )}
                <div className="min-w-0">
                  <h1
                    data-testid="feed-profile-name"
                    className="truncate text-2xl font-bold text-contrast"
                  >
                    {name}
                  </h1>
                  {teammate ? (
                    <p className="text-sm text-muted">{teammate.title}</p>
                  ) : null}
                  <p
                    data-testid="feed-profile-count"
                    className="mt-1 text-sm text-muted"
                  >
                    {t(I18nKey.FEED$PROFILE_MESSAGES, {
                      count: messages.length,
                    })}
                  </p>
                </div>
              </header>

              {messages.length === 0 ? (
                <p
                  data-testid="feed-profile-empty"
                  className="text-sm text-muted"
                >
                  {t(I18nKey.FEED$PROFILE_EMPTY)}
                </p>
              ) : (
                <ul
                  data-testid="feed-profile-messages"
                  className="flex flex-col gap-4"
                >
                  {messages.map((message) => (
                    <li
                      key={message.id}
                      data-testid="feed-profile-message"
                      className="rounded-lg bg-surface-raised p-4"
                    >
                      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
                        <NavigationLink
                          to={backendScopedPath(
                            `/conversations/${message.conversationId}`,
                          )}
                          className="font-medium text-contrast hover:underline"
                        >
                          {t(I18nKey.FEED$PROFILE_IN, {
                            title:
                              message.conversationTitle ??
                              t(I18nKey.FEED$UNTITLED),
                          })}
                        </NavigationLink>
                        <span>
                          {formatRelativeTime(
                            message.timestamp,
                            i18n.language,
                            t,
                          )}
                        </span>
                      </p>
                      <p className="mt-2 break-words text-[15px] text-contrast">
                        <FeedMentionText text={message.text} />
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p
              data-testid="feed-profile-not-found"
              className="text-sm text-muted"
            >
              {t(I18nKey.FEED$PROFILE_NOT_FOUND)}
            </p>
          )}
        </div>
      </div>
    </FeedColumns>
  );
}
