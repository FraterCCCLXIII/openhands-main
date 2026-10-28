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
import { factoryIconKey } from "#/utils/feed-icon-keys";
import { cn } from "#/utils/utils";
import { FeedCustomIcon } from "./feed-custom-icon";
import { FeedTeammateAvatar } from "./feed-teammate-avatar";

interface FeedFactoryHeaderProps {
  factory: FeedFactory;
  /** Every loaded conversation; the header picks out the factory's own. */
  conversations: AppConversation[];
  /** "column" stacks the card for the narrow right column; "banner" spans the feed. */
  variant?: "banner" | "column";
}

/** Banner for the selected factory: icon, description, owner and live numbers. */
export function FeedFactoryHeader({
  factory,
  conversations,
  variant = "banner",
}: FeedFactoryHeaderProps) {
  const isColumn = variant === "column";
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
      data-variant={variant}
      className={
        isColumn
          ? "mb-5 border-b border-border px-2 pb-5"
          : "shrink-0 px-[calc(1rem+var(--feed-gutter,0px))] pt-4"
      }
    >
      <div
        className={cn(
          isColumn
            ? "flex flex-col gap-4"
            : "mx-auto flex w-full max-w-[680px] items-start gap-4 rounded-lg border border-border bg-surface-raised p-4",
        )}
      >
        <span data-testid="feed-factory-icon" className="shrink-0">
          <FeedCustomIcon
            iconKey={factoryIconKey(factory.id)}
            size={isColumn ? 56 : 64}
            radius={16}
            glyph={<Icon size={isColumn ? 28 : 32} aria-hidden />}
            fallback={
              <span
                className={cn(
                  "flex items-center justify-center rounded-2xl",
                  isColumn ? "size-14" : "size-16",
                  factory.className,
                )}
              >
                <Icon size={isColumn ? 28 : 32} aria-hidden />
              </span>
            }
          />
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
            className={cn(
              "mt-3 flex text-xs text-muted",
              isColumn
                ? "mt-4 flex-col items-start gap-3"
                : "flex-wrap items-center gap-x-4 gap-y-2",
            )}
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
