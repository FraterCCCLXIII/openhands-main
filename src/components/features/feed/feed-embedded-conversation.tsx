import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { NavigationLink } from "#/components/shared/navigation-link";
import {
  NavigationProvider,
  useNavigation,
} from "#/context/navigation-context";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { I18nKey } from "#/i18n/declaration";
import { ConversationView } from "#/routes/conversation";

interface FeedEmbeddedConversationProps {
  conversationId: string;
  onClose: () => void;
}

/**
 * The real conversation page (chat thread, composer, drawer) inside Tower's
 * middle column. The conversation hooks read the id from the navigation
 * context, so this supplies it instead of the /conversations/:id route. Tower
 * shows one conversation at a time and the app's /conversations route is not
 * mounted alongside it, so there is a single socket per conversation; leaving
 * or switching unmounts the view and closes it. Mount it with
 * `key={conversationId}` so a switch tears the previous one down completely.
 */
export default function FeedEmbeddedConversation({
  conversationId,
  onClose,
}: FeedEmbeddedConversationProps) {
  const { t } = useTranslation("openhands");
  const navigation = useNavigation();
  const backendScopedPath = useBackendScopedPath();
  const [missing, setMissing] = useState(false);
  const handleMissing = useCallback(() => setMissing(true), []);

  const embeddedNavigation = useMemo(
    () => ({ ...navigation, conversationId }),
    [navigation, conversationId],
  );

  return (
    <div
      data-testid="feed-embedded-conversation"
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 py-2">
        <button
          type="button"
          data-testid="feed-embedded-back"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted hover:bg-surface hover:text-contrast"
        >
          <ArrowLeft size={14} aria-hidden />
          {t(I18nKey.FEED$CONVERSATION_BACK)}
        </button>
        <NavigationLink
          to={backendScopedPath(`/conversations/${conversationId}`)}
          data-testid="feed-embedded-open-full"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted hover:bg-surface hover:text-contrast"
        >
          {t(I18nKey.FEED$CONVERSATION_OPEN_FULL)}
          <ExternalLink size={14} aria-hidden />
        </NavigationLink>
      </div>
      <div className="min-h-0 flex-1">
        {missing ? (
          <p
            data-testid="feed-embedded-unavailable"
            className="px-4 py-6 text-sm text-muted"
          >
            {t(I18nKey.FEED$CONVERSATION_UNAVAILABLE)}
          </p>
        ) : (
          <NavigationProvider value={embeddedNavigation}>
            <ConversationView onMissing={handleMissing} />
          </NavigationProvider>
        )}
      </div>
    </div>
  );
}
