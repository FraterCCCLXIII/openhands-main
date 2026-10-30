import type { ReactNode } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Inbox } from "lucide-react";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useFeedFactories } from "#/hooks/use-feed-factories";
import {
  FEED_INBOX_FACTORY_PARAM,
  FEED_VIEW_PARAM,
  feedInboxPath,
} from "#/hooks/use-feed-view";
import { I18nKey } from "#/i18n/declaration";
import {
  countUnseenInboxItems,
  useFactoryInboxStore,
} from "#/stores/factory-inbox-store";
import { factoryIconKey } from "#/utils/feed-icon-keys";
import { cn } from "#/utils/utils";
import { FeedCustomIcon } from "./feed-custom-icon";
import { FeedIconTile } from "./feed-icon-tile";

interface InboxRowProps {
  to: string;
  label: string;
  unseen: number;
  current: boolean;
  testId: string;
  icon: ReactNode;
}

function InboxRow({ to, label, unseen, current, testId, icon }: InboxRowProps) {
  const { t } = useTranslation("openhands");
  return (
    <li>
      <NavigationLink
        to={to}
        data-testid={testId}
        aria-current={current ? "page" : false}
        className={cn(
          "flex items-center gap-3 rounded-lg px-2 py-2 text-[15px]",
          current
            ? "bg-surface-raised font-medium text-contrast"
            : "text-muted hover:bg-surface-raised hover:text-contrast",
        )}
      >
        <span className="flex size-9 shrink-0 items-center justify-center">
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {unseen > 0 ? (
          <span
            data-testid="feed-inbox-row-badge"
            aria-label={t(I18nKey.FEED$INBOX_UNREAD, { count: unseen })}
            className="rounded-full bg-[var(--oh-interactive-hover)] px-2 py-0.5 text-xs font-medium text-contrast"
          >
            {unseen}
          </span>
        ) : null}
      </NavigationLink>
    </li>
  );
}

/**
 * The Inbox section's rows: "All factories" first, then one row per factory.
 * Each opens the Inbox tab, scoped to that factory or to every factory.
 */
export function FeedInboxNav() {
  const { t } = useTranslation("openhands");
  const factories = useFeedFactories();
  const backendScopedPath = useBackendScopedPath();
  const [searchParams] = useSearchParams();
  const items = useFactoryInboxStore((state) => state.items);
  const lastSeenAt = useFactoryInboxStore((state) => state.lastSeenAt);
  const seenByFactory = useFactoryInboxStore((state) => state.seenByFactory);
  const markers = { lastSeenAt, seenByFactory };
  const inboxOpen = searchParams.get(FEED_VIEW_PARAM) === "inbox";
  const scope = searchParams.get(FEED_INBOX_FACTORY_PARAM);

  return (
    <ul data-testid="feed-inbox-nav" className="flex flex-col gap-0.5">
      <InboxRow
        testId="feed-inbox-all"
        to={backendScopedPath(feedInboxPath())}
        label={t(I18nKey.FEED$INBOX_ALL_FACTORIES)}
        unseen={countUnseenInboxItems(items, markers)}
        current={inboxOpen && !scope}
        icon={
          <span className="flex size-full items-center justify-center rounded-xl bg-surface text-contrast">
            <Inbox size={20} aria-hidden />
          </span>
        }
      />
      {factories.map(({ id, name, Icon, className }) => (
        <InboxRow
          key={id}
          testId="feed-inbox-factory"
          to={backendScopedPath(feedInboxPath(id))}
          label={name}
          unseen={countUnseenInboxItems(items, markers, id)}
          current={inboxOpen && scope === id}
          icon={
            <FeedCustomIcon
              iconKey={factoryIconKey(id)}
              size={36}
              radius={12}
              glyph={<Icon size={20} />}
              fallback={
                <FeedIconTile className={className}>
                  <Icon size={20} />
                </FeedIconTile>
              }
            />
          }
        />
      ))}
    </ul>
  );
}
