import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Users } from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { I18nKey } from "#/i18n/declaration";
import type { FeedFilter } from "#/utils/feed-filters";
import {
  FEED_TEAMMATES,
  feedProfilePath,
  getFeedTeammateIds,
  isFeedTeamDemoEnabled,
} from "#/utils/feed-team-demo";
import { useFeedFactories } from "#/hooks/use-feed-factories";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { FeedFilterRow } from "./feed-filter-row";
import { FeedIconMenu } from "./feed-icon-menu";
import { personIconKey } from "#/utils/feed-icon-keys";
import { FeedTeammateAvatar } from "./feed-teammate-avatar";

interface FeedContactsSidebarProps {
  conversations: AppConversation[];
  filter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
}

/**
 * Contacts: the people added to factories (a teammate or a pending invite),
 * each with the factories they are in. The simulated teammates, whose
 * conversations can be filtered, appear only in `?demoTeam=on` mode.
 */
export function FeedContactsSidebar({
  conversations,
  filter,
  onChange,
}: FeedContactsSidebarProps) {
  const { t } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const factories = useFeedFactories();
  const humanAssignments = useFeedFactoriesStore(
    (state) => state.humanAssignments,
  );
  const demo = isFeedTeamDemoEnabled(window.location.search);

  // One entry per person across all stages and factories.
  const members = useMemo(() => {
    const byId = new Map<
      string,
      { id: string; name: string; pending: boolean; factories: string[] }
    >();
    factories.forEach((factory) => {
      Object.values(humanAssignments?.[factory.id] ?? {}).forEach((list) =>
        list.forEach((person) => {
          const entry = byId.get(person.id) ?? {
            id: person.id,
            name: person.name,
            pending: person.status === "pending",
            factories: [],
          };
          if (!entry.factories.includes(factory.name)) {
            entry.factories.push(factory.name);
          }
          byId.set(person.id, entry);
        }),
      );
    });
    return [...byId.values()];
  }, [factories, humanAssignments]);

  if (!demo) {
    return (
      <section data-testid="feed-teammates">
        <h2 className="mb-1 px-2 text-[17px] font-semibold text-muted">
          {t(I18nKey.FEED$CONTACTS)}
        </h2>
        {members.length === 0 ? (
          <p
            data-testid="feed-contacts-empty"
            className="px-2 text-sm text-muted"
          >
            {t(I18nKey.FEED$CONTACTS_EMPTY)}
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {members.map((member) => (
              <li
                key={member.id}
                data-testid="feed-contact"
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-contrast"
              >
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-semibold"
                >
                  {member.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">
                    {member.name}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {member.factories.join(", ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }

  const teammateCount = (id: string) =>
    conversations.filter((c) => getFeedTeammateIds(c.id).includes(id)).length;

  return (
    <section data-testid="feed-teammates">
      <h2 className="mb-1 px-2 text-[17px] font-semibold text-muted">
        {t(I18nKey.FEED$CONTACTS)}
      </h2>
      <ul className="flex flex-col gap-0.5">
        <FeedFilterRow
          testId="feed-filter-teammate-all"
          label={t(I18nKey.FEED$ALL)}
          icon={<Users size={20} />}
          selected={filter.teammateId === null}
          onSelect={() => onChange({ ...filter, teammateId: null })}
        />
        {FEED_TEAMMATES.map((member) => (
          <FeedFilterRow
            key={member.id}
            testId="feed-filter-teammate"
            label={member.name}
            count={teammateCount(member.id)}
            icon={
              <span className="relative flex">
                <FeedTeammateAvatar teammate={member} size={36} />
                {member.online ? (
                  <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-success ring-2 ring-base" />
                ) : null}
              </span>
            }
            selected={filter.teammateId === member.id}
            onSelect={() => onChange({ ...filter, teammateId: member.id })}
            action={
              <FeedIconMenu
                iconKey={personIconKey(member.id)}
                subject={member.name}
              />
            }
            profile={{
              to: backendScopedPath(feedProfilePath(member.id)),
              label: t(I18nKey.FEED$PROFILE_VIEW),
            }}
          />
        ))}
      </ul>
    </section>
  );
}
