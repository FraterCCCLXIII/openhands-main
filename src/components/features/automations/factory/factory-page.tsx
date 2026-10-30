import {
  PAGE_TITLE_CLASS_NAME,
  PAGE_SUBTITLE_CLASS_NAME,
} from "#/components/shared/page-title";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import {
  ArrowLeft,
  Bot,
  ChartNoAxesGantt,
  FolderGit2,
  Inbox,
  KeyRound,
  LayoutDashboard,
  MessagesSquare,
  Activity,
  Sparkles,
  Timer,
  UsersRound,
  Workflow,
} from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { ConversationStatusDot } from "#/components/features/conversation-panel/conversation-status-dot";
import { FeedCustomIcon } from "#/components/features/feed/feed-custom-icon";
import { FeedIconTile } from "#/components/features/feed/feed-icon-tile";
import { FeedTeammateAvatar } from "#/components/features/feed/feed-teammate-avatar";
import {
  ManifestOverviewTiles,
  type OverviewTileView,
} from "#/components/features/manifest/manifest-overview-tiles";
import {
  ManifestSubpageLayout,
  type SubPageNavItem,
} from "#/components/features/manifest/manifest-subpage-layout";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useFeedFactories } from "#/hooks/use-feed-factories";
import { I18nKey } from "#/i18n/declaration";
import { factoryIconKey } from "#/utils/feed-icon-keys";
import {
  feedProfilePath,
  getFeedPerson,
  type FeedFactory,
} from "#/utils/feed-team-demo";
import { formatRelativeTime } from "#/utils/format-relative-time";
import { cn } from "#/utils/utils";
import { factoryPath } from "../factories-group";
import {
  automationActivityListClassName,
  automationActivityRowClassName,
} from "../automation-view-mode";
import { useFactoryData, type FactoryData } from "./use-factory-data";
import { FactoryAgentRail } from "./factory-agent-rail";
import { PipelinePage } from "./pipeline-page";
import { FactoryComposer } from "./factory-composer";
import { FactoryAutomations } from "./factory-automations";
import { FactoryGantt } from "./factory-gantt";
import { FeedInboxList } from "#/components/features/feed/feed-inbox-list";
import { FactoryIncoming } from "./factory-incoming";
import { FactorySkills } from "./factory-skills";
import { FactoryTeam } from "./factory-team";
import { FactoryVault } from "./factory-vault";
import { useFactoryRoster } from "#/hooks/use-factory-roster";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import {
  FactoryAddAgentModal,
  FactoryEditAgentModal,
} from "./factory-agent-modals";
import type { FactoryTarget } from "#/utils/factory-routing";

type FactorySection =
  | "overview"
  | "incoming"
  | "pipeline"
  | "schedule"
  | "conversations"
  | "agents"
  | "team"
  | "projects"
  | "skills"
  | "automations"
  | "vault";

const SECTIONS: FactorySection[] = [
  "overview",
  "incoming",
  "pipeline",
  "schedule",
  "conversations",
  "agents",
  "team",
  "projects",
  "skills",
  "automations",
  "vault",
];

const RECENT_LIMIT = 5;

function ConversationRows({
  conversations,
}: {
  conversations: AppConversation[];
}) {
  const { t, i18n } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  if (conversations.length === 0) {
    return (
      <p data-testid="factory-empty" className="text-sm text-muted">
        {t(I18nKey.AUTOMATE$FACTORY_EMPTY)}
      </p>
    );
  }
  return (
    <ul className={automationActivityListClassName}>
      {conversations.map((conversation) => (
        <li
          key={conversation.id}
          data-testid="factory-conversation"
          className={automationActivityRowClassName}
        >
          <NavigationLink
            to={backendScopedPath(`/conversations/${conversation.id}`)}
            className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
          >
            <ConversationStatusDot
              executionStatus={conversation.execution_status}
              sandboxStatus={conversation.sandbox_status}
            />
            <span className="min-w-0 flex-1 truncate font-medium">
              {conversation.title || t(I18nKey.FEED$UNTITLED)}
            </span>
            <span className="shrink-0 text-xs text-muted">
              {formatRelativeTime(conversation.updated_at, i18n.language, t)}
            </span>
          </NavigationLink>
        </li>
      ))}
    </ul>
  );
}

function FactoryHeader({ factory }: { factory: FeedFactory }) {
  const { t } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const owner = getFeedPerson(factory.ownerId);
  const { Icon } = factory;
  return (
    <header
      data-testid="factory-page-header"
      className="flex items-start gap-4"
    >
      <span className="size-14 shrink-0">
        <FeedCustomIcon
          iconKey={factoryIconKey(factory.id)}
          size={56}
          radius={16}
          glyph={<Icon size={28} />}
          fallback={
            <FeedIconTile className={factory.className}>
              <Icon size={28} />
            </FeedIconTile>
          }
        />
      </span>
      <div className="min-w-0">
        <h1 data-testid="factory-page-name" className={PAGE_TITLE_CLASS_NAME}>
          {factory.name}
        </h1>
        <p className={cn("mt-1", PAGE_SUBTITLE_CLASS_NAME)}>
          {factory.description}
        </p>
        {owner && !owner.isMe ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            {t(I18nKey.FEED$FACTORY_OWNER)}
            <NavigationLink
              to={backendScopedPath(feedProfilePath(owner.id))}
              className="flex items-center gap-1.5 font-medium text-contrast hover:underline"
            >
              <FeedTeammateAvatar teammate={owner} size={20} />
              {owner.name}
            </NavigationLink>
          </p>
        ) : null}
      </div>
    </header>
  );
}

function SectionBody({
  section,
  data,
}: {
  section: FactorySection;
  data: FactoryData;
}) {
  const { t } = useTranslation("openhands");

  if (section === "conversations") {
    return <ConversationRows conversations={data.conversations} />;
  }
  if (section === "agents") {
    if (data.agents.length === 0)
      return <ConversationRows conversations={[]} />;
    return (
      <ul className={automationActivityListClassName}>
        {data.agents.map(({ agent, conversations, live }) => (
          <li
            key={agent.name}
            data-testid="factory-agent"
            className={cn(
              automationActivityRowClassName,
              "items-center gap-3 px-3 py-2.5",
            )}
          >
            <span className="size-8 shrink-0">
              <FeedIconTile className={agent.className}>
                <agent.Icon size={16} />
              </FeedIconTile>
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {agent.name}
            </span>
            <span className="text-xs text-muted">
              {t(I18nKey.FEED$FACTORY_CONVERSATIONS, { count: conversations })}
            </span>
            <span
              className={cn(
                "text-xs",
                live > 0 ? "text-success" : "text-muted",
              )}
            >
              {t(I18nKey.FEED$FACTORY_LIVE, { count: live })}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (section === "projects") {
    if (data.projects.length === 0)
      return <ConversationRows conversations={[]} />;
    return (
      <ul className={automationActivityListClassName}>
        {data.projects.map(({ project, conversations }) => (
          <li
            key={project}
            data-testid="factory-project"
            className={cn(
              automationActivityRowClassName,
              "items-center gap-3 px-3 py-2.5",
            )}
          >
            <FolderGit2 size={16} aria-hidden className="shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {project}
            </span>
            <span className="text-xs text-muted">
              {t(I18nKey.FEED$FACTORY_CONVERSATIONS, { count: conversations })}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

/**
 * One factory as a dashboard page: a back button to Automate, a left rail of
 * its sections, and an overview of its conversations, agents and projects.
 */
export function FactoryPage() {
  const { t, i18n } = useTranslation("openhands");
  const { factoryId = "", section: sectionParam } = useParams();
  const backendScopedPath = useBackendScopedPath();
  const factories = useFeedFactories();
  const factory = factories.find((candidate) => candidate.id === factoryId);
  const data = useFactoryData(factoryId);
  const [target, setTarget] = useState<FactoryTarget>({ kind: "inbox" });
  const roster = useFactoryRoster(factoryId, data);
  const addedNames = useFeedFactoriesStore(
    (state) => state.addedAgents[factoryId],
  );
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const editingEntry = [roster.coordinator, ...roster.others].find(
    ({ agent }) => agent.name === editing,
  );
  const section: FactorySection = SECTIONS.includes(
    sectionParam as FactorySection,
  )
    ? (sectionParam as FactorySection)
    : "overview";

  const rail: Record<FactorySection, Pick<SubPageNavItem, "label" | "Icon">> = {
    overview: {
      label: t(I18nKey.CONVERSATION$OVERVIEW),
      Icon: LayoutDashboard,
    },
    incoming: { label: t(I18nKey.FACTORY$INCOMING), Icon: Inbox },
    pipeline: { label: t(I18nKey.FACTORY$PIPELINE), Icon: Workflow },
    schedule: {
      label: t(I18nKey.AUTOMATIONS$DETAIL$SCHEDULE),
      Icon: ChartNoAxesGantt,
    },
    conversations: {
      label: t(I18nKey.SIDEBAR$CONVERSATIONS),
      Icon: MessagesSquare,
    },
    agents: { label: t(I18nKey.FEED$AGENTS), Icon: Bot },
    team: { label: t(I18nKey.FACTORY$TEAM), Icon: UsersRound },
    projects: { label: t(I18nKey.FEED$PROJECTS), Icon: FolderGit2 },
    skills: { label: t(I18nKey.SIDEBAR$SKILLS), Icon: Sparkles },
    automations: {
      label: t(I18nKey.CONVERSATION_PANEL$AUTOMATIONS),
      Icon: Timer,
    },
    vault: { label: t(I18nKey.FACTORY$KEYS_AND_SECRETS), Icon: KeyRound },
  };
  const items: SubPageNavItem[] = SECTIONS.map((id) => ({
    to: backendScopedPath(factoryPath(factoryId, id === "overview" ? "" : id)),
    label: rail[id].label,
    Icon: rail[id].Icon,
    testId: `factory-navigation-${id}`,
  }));

  const tiles: OverviewTileView[] = [
    {
      key: "conversations",
      label: t(I18nKey.SIDEBAR$CONVERSATIONS),
      value: String(data.conversations.length),
      detail: data.lastActivity
        ? t(I18nKey.FEED$FACTORY_LAST_ACTIVITY, {
            time: formatRelativeTime(data.lastActivity, i18n.language, t),
          })
        : "",
      Icon: MessagesSquare,
    },
    {
      key: "live",
      label: t(I18nKey.FEED$LIVE),
      value: String(data.live),
      detail: "",
      Icon: Activity,
    },
    {
      key: "agents",
      label: t(I18nKey.FEED$AGENTS),
      value: String(roster.others.length + 1),
      detail: "",
      Icon: Bot,
    },
    {
      key: "projects",
      label: t(I18nKey.FEED$PROJECTS),
      value: String(data.projects.length),
      detail: "",
      Icon: FolderGit2,
    },
  ];

  return (
    <ManifestSubpageLayout
      heading={factory?.name ?? t(I18nKey.FEED$FACTORIES)}
      navTestIdBase="factory-navbar"
      items={items}
      // A node map needs room; the other sections read best in a narrow column.
      contentClassName={
        section === "pipeline" || section === "schedule"
          ? "max-w-none"
          : undefined
      }
      footer={
        factory && (section === "overview" || section === "incoming") ? (
          <FactoryComposer
            factory={factory}
            data={data}
            target={target}
            onTarget={setTarget}
            showRecent={section === "overview"}
          />
        ) : undefined
      }
    >
      <NavigationLink
        to={backendScopedPath("/factory")}
        data-testid="factory-back"
        className="flex items-center gap-1.5 self-start text-sm text-muted hover:text-contrast"
      >
        <ArrowLeft size={14} aria-hidden />
        {t(I18nKey.COMMON$BACK)}
      </NavigationLink>

      {factory ? (
        <>
          <FactoryHeader factory={factory} />
          {section === "overview" ? (
            <>
              <ManifestOverviewTiles
                label={t(I18nKey.CONVERSATION$OVERVIEW)}
                tiles={tiles}
              />
              <FactoryAgentRail
                {...roster}
                target={target}
                onTarget={setTarget}
                onAdd={() => setAdding(true)}
                onEdit={setEditing}
              />
              <section>
                <h2 className="mb-3 text-base font-semibold text-foreground">
                  {t(I18nKey.HOME$DASHBOARD_RECENT_CONVERSATIONS)}
                </h2>
                <ConversationRows
                  conversations={data.conversations.slice(0, RECENT_LIMIT)}
                />
              </section>
            </>
          ) : section === "incoming" ? (
            <section data-testid="factory-section-incoming">
              <h2 className="mb-3 text-base font-semibold text-foreground">
                {rail.incoming.label}
              </h2>
              <div className="flex flex-col gap-6">
                <FeedInboxList factoryId={factory.id} />
                <FactoryIncoming factory={factory} data={data} />
              </div>
            </section>
          ) : section === "schedule" ? (
            <section data-testid="factory-section-schedule">
              <h2 className="mb-3 text-base font-semibold text-foreground">
                {rail.schedule.label}
              </h2>
              <FactoryGantt conversations={data.conversations} />
            </section>
          ) : section === "pipeline" ? (
            <PipelinePage factory={factory} data={data} />
          ) : section === "team" ? (
            <section data-testid="factory-section-team">
              <h2 className="mb-3 text-base font-semibold text-foreground">
                {rail.team.label}
              </h2>
              <FactoryTeam
                factory={factory}
                roster={roster}
                removableAgents={addedNames ?? []}
              />
            </section>
          ) : section === "skills" ||
            section === "automations" ||
            section === "vault" ? (
            <section data-testid={`factory-section-${section}`}>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                {rail[section].label}
              </h2>
              {section === "skills" ? (
                <FactorySkills factoryId={factory.id} />
              ) : section === "automations" ? (
                <FactoryAutomations factoryId={factory.id} />
              ) : (
                <FactoryVault factoryId={factory.id} />
              )}
            </section>
          ) : (
            <section data-testid={`factory-section-${section}`}>
              <h2 className="mb-3 text-base font-semibold text-foreground">
                {rail[section].label}
              </h2>
              <SectionBody section={section} data={data} />
            </section>
          )}
          {adding ? (
            <FactoryAddAgentModal
              factoryId={factory.id}
              roster={roster}
              onClose={() => setAdding(false)}
            />
          ) : null}
          {editingEntry ? (
            <FactoryEditAgentModal
              factoryId={factory.id}
              entry={editingEntry}
              isCoordinator={editingEntry === roster.coordinator}
              isAdded={Boolean(addedNames?.includes(editingEntry.agent.name))}
              onClose={() => setEditing(null)}
            />
          ) : null}
        </>
      ) : (
        <p data-testid="factory-not-found" className="text-sm text-muted">
          {t(I18nKey.AUTOMATE$FACTORY_NOT_FOUND)}
        </p>
      )}
    </ManifestSubpageLayout>
  );
}
