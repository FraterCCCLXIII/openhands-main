import { useTranslation } from "react-i18next";
import { Activity, Clock, FolderGit2, MessagesSquare } from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { I18nKey } from "#/i18n/declaration";
import { ExecutionStatus } from "#/types/agent-server/core";
import { getFeedProject } from "#/utils/feed-filters";
import {
  feedProfilePath,
  getFeedFactory,
  getFeedPerson,
  type FeedFactory,
} from "#/utils/feed-team-demo";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { FeedTeammateAvatar } from "./feed-teammate-avatar";

interface FeedFactoryHeaderProps {
  factory: FeedFactory;
  /** Every loaded conversation; the header picks out the factory's own. */
  conversations: AppConversation[];
}

/** Banner for the selected factory: icon, description, owner and live numbers. */
export function FeedFactoryHeader({
  factory,
  conversations,
}: FeedFactoryHeaderProps) {
  const { t, i18n } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const own = conversations.filter(
    (c) => getFeedFactory(c.id).id === factory.id,
  );
  const live = own.filter(
    (c) => c.execution_status === ExecutionStatus.RUNNING,
  ).length;
  const projects = new Set(own.map(getFeedProject).filter(Boolean)).size;
  const lastActivity = own.reduce<string | null>(
    (latest, c) => (!latest || c.updated_at > latest ? c.updated_at : latest),
    null,
  );
  const owner = getFeedPerson(factory.ownerId);
  const { Icon } = factory;

  return (
    <header
      data-testid="feed-factory-header"
      data-factory-id={factory.id}
      className="mx-auto w-full max-w-[680px] shrink-0 px-4 pt-4"
    >
      <div className="flex items-start gap-4 rounded-lg border border-border bg-surface-raised p-4">
        <span
          data-testid="feed-factory-icon"
          className={`flex size-16 shrink-0 items-center justify-center rounded-2xl ${factory.className}`}
        >
          <Icon size={32} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2
            data-testid="feed-factory-name"
            className="text-xl font-bold text-contrast"
          >
            {factory.name}
          </h2>
          <p
            data-testid="feed-factory-description"
            className="mt-1 text-[15px] text-muted"
          >
            {factory.description}
          </p>
          <ul
            data-testid="feed-factory-metadata"
            className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted"
          >
            {owner && !owner.isMe ? (
              <li className="flex items-center gap-1.5">
                <span>{t(I18nKey.FEED$FACTORY_OWNER)}</span>
                <NavigationLink
                  to={backendScopedPath(feedProfilePath(owner.id))}
                  data-testid="feed-factory-owner"
                  className="flex items-center gap-1.5 font-medium text-contrast hover:underline"
                >
                  <FeedTeammateAvatar teammate={owner} size={20} />
                  {owner.name}
                </NavigationLink>
              </li>
            ) : null}
            <li
              data-testid="feed-factory-conversations"
              className="flex items-center gap-1.5"
            >
              <MessagesSquare size={14} aria-hidden />
              {t(I18nKey.FEED$FACTORY_CONVERSATIONS, { count: own.length })}
            </li>
            <li
              data-testid="feed-factory-live"
              className="flex items-center gap-1.5"
            >
              <Activity size={14} aria-hidden />
              {t(I18nKey.FEED$FACTORY_LIVE, { count: live })}
            </li>
            <li
              data-testid="feed-factory-projects"
              className="flex items-center gap-1.5"
            >
              <FolderGit2 size={14} aria-hidden />
              {t(I18nKey.FEED$FACTORY_PROJECTS, { count: projects })}
            </li>
            {lastActivity ? (
              <li
                data-testid="feed-factory-last-activity"
                className="flex items-center gap-1.5"
              >
                <Clock size={14} aria-hidden />
                {t(I18nKey.FEED$FACTORY_LAST_ACTIVITY, {
                  time: formatRelativeTime(lastActivity, i18n.language, t),
                })}
              </li>
            ) : null}
          </ul>
        </div>
      </div>
    </header>
  );
}
