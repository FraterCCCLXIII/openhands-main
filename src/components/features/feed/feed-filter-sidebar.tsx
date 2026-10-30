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
  FEED_ME_ID,
  feedProfilePath,
  isFeedTeamDemoEnabled,
} from "#/utils/feed-team-demo";
import { useFeedAgentConfigStore } from "#/stores/feed-agent-config-store";
import { agentTint } from "#/utils/feed-agent-identity";
import { FeedSection } from "./feed-section";
import { FeedSectionAddMenu } from "./feed-section-add-menu";
import { FeedInboxNav } from "./feed-inbox-nav";
import {
  countUnseenInboxItems,
  useFactoryInboxStore,
} from "#/stores/factory-inbox-store";
import { FeedConversationList } from "./feed-conversation-list";
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
import {
  useFactoryResolver,
  useFeedFactories,
} from "#/hooks/use-feed-factories";
import { FeedRowStats } from "./feed-row-stats";
import {
  FEED_DEMO_AGENTS,
  FEED_DEMO_AGENT_FILTER_PREFIX,
  pickFeedDemoAgent,
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
  const factories = useFeedFactories();
  const resolveFactory = useFactoryResolver();
  const agentConfigs = useFeedAgentConfigStore((state) => state.configs);
  const inboxItems = useFactoryInboxStore((state) => state.items);
  const inboxLastSeenAt = useFactoryInboxStore((state) => state.lastSeenAt);
  const inboxSeenByFactory = useFactoryInboxStore(
    (state) => state.seenByFactory,
  );
  const unreadInbox = countUnseenInboxItems(inboxItems, {
    lastSeenAt: inboxLastSeenAt,
    seenByFactory: inboxSeenByFactory,
  });
  const teamDemo = isFeedTeamDemoEnabled(window.location.search);
  const stats = (group: AppConversation[]) => (
    <FeedRowStats conversations={group} />
  );
  const inFactory = (id: string) =>
    conversations.filter((c) => resolveFactory(c)?.id === id);
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
      <FeedSection
        id="inbox"
        testId="feed-inbox-section"
        title={t(I18nKey.FEED$INBOX)}
        badge={
          unreadInbox > 0 ? (
            <span
              data-testid="feed-inbox-badge"
              aria-label={t(I18nKey.FEED$INBOX_UNREAD, { count: unreadInbox })}
              className="ml-1 rounded-full bg-[var(--oh-interactive-hover)] px-2 py-0.5 text-xs font-medium text-contrast"
            >
              {unreadInbox}
            </span>
          ) : null
        }
      >
        {() => <FeedInboxNav />}
      </FeedSection>
      <FeedSection
        id="factories"
        testId="feed-factories"
        title={t(I18nKey.FEED$FACTORIES)}
        action={<FeedSectionAddMenu primary="factory" />}
      >
        {() => (
          <>
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
              {factories.map(({ id, name, Icon, className }) => (
                <FeedFilterRow
                  key={id}
                  testId="feed-filter-factory"
                  label={name}
                  count={inFactory(id).length}
                  meta={stats(inFactory(id))}
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
            {factories.length === 0 ? (
              <p
                data-testid="feed-factories-empty"
                className="px-2 pt-1 text-sm text-muted"
              >
                {t(I18nKey.FEED$FACTORIES_EMPTY)}
              </p>
            ) : null}
          </>
        )}
      </FeedSection>

      <FeedSection
        id="projects"
        title={t(I18nKey.FEED$PROJECTS)}
        action={<FeedSectionAddMenu primary="project" />}
      >
        {() => (
          <>
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
          </>
        )}
      </FeedSection>

      <FeedSection
        id="agents"
        title={t(I18nKey.FEED$AGENTS)}
        action={<FeedSectionAddMenu primary="agent" />}
      >
        {() => (
          <>
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
                        c.launched_agent_profile?.agent_profile_id ===
                        profile.id,
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
                        <FeedIconTile
                          className={agentTint(
                            profile.id,
                            agentConfigs[profile.name],
                          )}
                        >
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
              {profiles.length === 0 && !teamDemo ? (
                <p
                  data-testid="feed-agents-empty"
                  className="px-2 pt-1 text-sm text-muted"
                >
                  {t(I18nKey.FEED$AGENTS_EMPTY)}
                </p>
              ) : null}
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
                        onSelect={() =>
                          onChange({ ...filter, agentProfileId: id })
                        }
                      />
                    );
                  })
                : null}
            </ul>
          </>
        )}
      </FeedSection>
      <FeedConversationList conversations={conversations} filter={filter} />
    </nav>
  );
}
