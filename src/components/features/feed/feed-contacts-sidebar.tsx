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
import { FeedFilterRow } from "./feed-filter-row";
import { FeedIconMenu } from "./feed-icon-menu";
import { personIconKey } from "#/utils/feed-icon-keys";
import { FeedTeammateAvatar } from "./feed-teammate-avatar";

interface FeedContactsSidebarProps {
  conversations: AppConversation[];
  filter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
}

/** The simulated teammates, like Facebook's Contacts: filter by one or open their profile. */
export function FeedContactsSidebar({
  conversations,
  filter,
  onChange,
}: FeedContactsSidebarProps) {
  const { t } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  if (!isFeedTeamDemoEnabled(window.location.search)) return null;

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
