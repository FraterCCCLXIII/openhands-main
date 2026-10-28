import { useTranslation } from "react-i18next";
import { Bot, Folders, LayoutGrid } from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { AgentBrandIcon } from "#/components/shared/agent-brand-icon";
import { ACP_PROVIDER_FALLBACK_ICON } from "#/constants/acp-providers";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { I18nKey } from "#/i18n/declaration";
import {
  countFeedAgentProfiles,
  countFeedProjects,
  getFeedProject,
  type FeedFilter,
} from "#/utils/feed-filters";
import {
  FEED_FACTORIES,
  FEED_ME_ID,
  feedProfilePath,
  getFeedFactory,
  isFeedTeamDemoEnabled,
} from "#/utils/feed-team-demo";
import { FeedFilterRow } from "./feed-filter-row";
import { FeedCustomIcon } from "./feed-custom-icon";
import { FeedIconMenu } from "./feed-icon-menu";
import { FeedIconTile } from "./feed-icon-tile";
import {
  agentIconKey,
  factoryIconKey,
  personIconKey,
} from "#/utils/feed-icon-keys";
import { FeedProjectRow } from "./feed-project-row";
import { FeedRowStats } from "./feed-row-stats";
import {
  FEED_DEMO_AGENTS,
  FEED_DEMO_AGENT_FILTER_PREFIX,
  pickFeedDemoAgent,
  pickFeedTint,
} from "#/utils/feed-demo-agents";
import { FeedUserAvatar } from "./feed-user-avatar";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";

interface FeedFilterSidebarProps {
  /** Every loaded conversation, so counts don't shrink as filters apply. */
  conversations: AppConversation[];
  filter: FeedFilter;
  onChange: (filter: FeedFilter) => void;
}

/** Project list with an "All" row, and below it the agent profile list. */
export function FeedFilterSidebar({
  conversations,
  filter,
  onChange,
}: FeedFilterSidebarProps) {
  const { t } = useTranslation("openhands");
  const { data: profileData } = useAgentProfiles();
  const projects = countFeedProjects(conversations);
  const profileCounts = countFeedAgentProfiles(conversations);
  const backendScopedPath = useBackendScopedPath();
  const teamDemo = isFeedTeamDemoEnabled(window.location.search);
  const stats = (group: AppConversation[]) =>
    teamDemo ? <FeedRowStats conversations={group} /> : undefined;
  const factoryCount = (id: string) =>
    conversations.filter((c) => getFeedFactory(c.id).id === id).length;
  const profiles = (profileData?.profiles ?? []).filter(
    (profile): profile is typeof profile & { id: string } => !!profile.id,
  );

  return (
    <nav
      data-testid="feed-filters"
      aria-label={t(I18nKey.FEED$FILTERS)}
      className="flex flex-col gap-5"
    >
      <div className="group flex items-center gap-1 rounded-lg hover:bg-surface-raised">
        <NavigationLink
          to={backendScopedPath(feedProfilePath(FEED_ME_ID))}
          data-testid="feed-profile-link"
          className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-[15px] font-medium text-contrast"
        >
          <FeedUserAvatar size={36} />
          <span className="min-w-0 flex-1 truncate">
            {t(I18nKey.FEED$ROLE_YOU)}
          </span>
          <span className="text-xs font-normal text-muted">
            {t(I18nKey.FEED$PROFILE_VIEW)}
          </span>
        </NavigationLink>
        <span className="opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 has-[[aria-expanded=true]]:opacity-100">
          <FeedIconMenu
            iconKey={personIconKey(FEED_ME_ID)}
            subject={t(I18nKey.FEED$ROLE_YOU)}
          />
        </span>
      </div>
      {teamDemo ? (
        <section data-testid="feed-factories">
          <h2 className="mb-1 px-2 text-[17px] font-semibold text-muted">
            {t(I18nKey.FEED$FACTORIES)}
          </h2>
          <ul className="flex flex-col gap-0.5">
            <FeedFilterRow
              testId="feed-filter-factory-all"
              label={t(I18nKey.FEED$ALL)}
              icon={<LayoutGrid size={20} />}
              meta={stats(conversations)}
              count={conversations.length}
              selected={filter.factoryId === null}
              onSelect={() => onChange({ ...filter, factoryId: null })}
            />
            {FEED_FACTORIES.map(({ id, name, Icon, className }) => (
              <FeedFilterRow
                key={id}
                testId="feed-filter-factory"
                label={name}
                count={factoryCount(id)}
                meta={stats(
                  conversations.filter((c) => getFeedFactory(c.id).id === id),
                )}
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
                action={
                  <FeedIconMenu iconKey={factoryIconKey(id)} subject={name} />
                }
                selected={filter.factoryId === id}
                onSelect={() => onChange({ ...filter, factoryId: id })}
              />
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h2 className="mb-1 px-2 text-[17px] font-semibold text-muted">
          {t(I18nKey.FEED$PROJECTS)}
        </h2>
        <ul className="flex flex-col gap-0.5">
          <FeedFilterRow
            testId="feed-filter-project-all"
            label={t(I18nKey.FEED$ALL)}
            icon={<Folders size={20} />}
            meta={stats(conversations)}
            count={conversations.length}
            selected={filter.project === null}
            onSelect={() => onChange({ ...filter, project: null })}
          />
          {projects.map(({ project, count }) => (
            <FeedProjectRow
              key={project}
              project={project}
              count={count}
              meta={stats(
                conversations.filter((c) => getFeedProject(c) === project),
              )}
              selected={filter.project === project}
              onSelect={() => onChange({ ...filter, project })}
            />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 px-2 text-[17px] font-semibold text-muted">
          {t(I18nKey.FEED$AGENTS)}
        </h2>
        <ul className="flex flex-col gap-0.5">
          <FeedFilterRow
            testId="feed-filter-agent-all"
            label={t(I18nKey.FEED$ALL)}
            meta={stats(conversations)}
            icon={<Bot size={20} />}
            selected={filter.agentProfileId === null}
            onSelect={() => onChange({ ...filter, agentProfileId: null })}
          />
          {profiles.map((profile) => (
            <FeedFilterRow
              key={profile.id}
              testId="feed-filter-agent"
              label={profile.name}
              count={profileCounts.get(profile.id) ?? 0}
              meta={stats(
                conversations.filter(
                  (c) =>
                    c.launched_agent_profile?.agent_profile_id === profile.id,
                ),
              )}
              icon={
                <FeedCustomIcon
                  iconKey={agentIconKey(profile.id)}
                  size={36}
                  radius={12}
                  glyph={
                    <AgentBrandIcon
                      kind={
                        profile.agent_kind === "acp"
                          ? ACP_PROVIDER_FALLBACK_ICON
                          : "openhands"
                      }
                      size={20}
                    />
                  }
                  fallback={
                    <FeedIconTile className={pickFeedTint(profile.id)}>
                      <AgentBrandIcon
                        kind={
                          profile.agent_kind === "acp"
                            ? ACP_PROVIDER_FALLBACK_ICON
                            : "openhands"
                        }
                        size={20}
                      />
                    </FeedIconTile>
                  }
                />
              }
              action={
                <FeedIconMenu
                  iconKey={agentIconKey(profile.id)}
                  subject={profile.name}
                />
              }
              selected={filter.agentProfileId === profile.id}
              onSelect={() =>
                onChange({ ...filter, agentProfileId: profile.id })
              }
            />
          ))}
          {teamDemo
            ? FEED_DEMO_AGENTS.map(({ name, Icon, className }) => {
                const id = `${FEED_DEMO_AGENT_FILTER_PREFIX}${name}`;
                const own = conversations.filter(
                  (c) => pickFeedDemoAgent(c.id).name === name,
                );
                return (
                  <FeedFilterRow
                    key={id}
                    testId="feed-filter-agent-persona"
                    label={name}
                    count={own.length}
                    meta={stats(own)}
                    icon={
                      <FeedCustomIcon
                        iconKey={agentIconKey(`demo:${name}`)}
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
                    action={
                      <FeedIconMenu
                        iconKey={agentIconKey(`demo:${name}`)}
                        subject={name}
                      />
                    }
                    selected={filter.agentProfileId === id}
                    onSelect={() => onChange({ ...filter, agentProfileId: id })}
                  />
                );
              })
            : null}
        </ul>
      </section>
    </nav>
  );
}
