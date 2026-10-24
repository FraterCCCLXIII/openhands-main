import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { FolderGit2 } from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { AgentBrandIcon } from "#/components/shared/agent-brand-icon";
import { ACP_PROVIDER_FALLBACK_ICON } from "#/constants/acp-providers";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { I18nKey } from "#/i18n/declaration";
import {
  countFeedAgentProfiles,
  countFeedProjects,
  type FeedFilter,
} from "#/utils/feed-filters";
import { cn } from "#/utils/utils";

function FilterRow({
  label,
  count,
  icon,
  selected,
  onSelect,
  testId,
}: {
  label: string;
  count?: number;
  icon?: ReactNode;
  selected: boolean;
  onSelect: () => void;
  testId: string;
}) {
  return (
    <li>
      <button
        type="button"
        data-testid={testId}
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm",
          selected
            ? "bg-surface-raised font-medium text-contrast"
            : "text-muted hover:bg-surface-raised hover:text-contrast",
        )}
      >
        {icon ? <span className="shrink-0">{icon}</span> : null}
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {count !== undefined ? (
          <span className="text-xs text-muted">{count}</span>
        ) : null}
      </button>
    </li>
  );
}

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
  const profiles = (profileData?.profiles ?? []).filter(
    (profile): profile is typeof profile & { id: string } => !!profile.id,
  );

  return (
    <nav
      data-testid="feed-filters"
      aria-label={t(I18nKey.FEED$FILTERS)}
      className="flex flex-col gap-5"
    >
      <section>
        <h2 className="mb-1 px-2 text-xs font-semibold uppercase text-muted">
          {t(I18nKey.FEED$PROJECTS)}
        </h2>
        <ul className="flex flex-col gap-0.5">
          <FilterRow
            testId="feed-filter-project-all"
            label={t(I18nKey.FEED$ALL)}
            count={conversations.length}
            selected={filter.project === null}
            onSelect={() => onChange({ ...filter, project: null })}
          />
          {projects.map(({ project, count }) => (
            <FilterRow
              key={project}
              testId="feed-filter-project"
              label={project}
              count={count}
              icon={<FolderGit2 size={14} />}
              selected={filter.project === project}
              onSelect={() => onChange({ ...filter, project })}
            />
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 px-2 text-xs font-semibold uppercase text-muted">
          {t(I18nKey.FEED$AGENTS)}
        </h2>
        <ul className="flex flex-col gap-0.5">
          <FilterRow
            testId="feed-filter-agent-all"
            label={t(I18nKey.FEED$ALL)}
            selected={filter.agentProfileId === null}
            onSelect={() => onChange({ ...filter, agentProfileId: null })}
          />
          {profiles.map((profile) => (
            <FilterRow
              key={profile.id}
              testId="feed-filter-agent"
              label={profile.name}
              count={profileCounts.get(profile.id) ?? 0}
              icon={
                <AgentBrandIcon
                  kind={
                    profile.agent_kind === "acp"
                      ? ACP_PROVIDER_FALLBACK_ICON
                      : "openhands"
                  }
                  size={12}
                />
              }
              selected={filter.agentProfileId === profile.id}
              onSelect={() =>
                onChange({ ...filter, agentProfileId: profile.id })
              }
            />
          ))}
        </ul>
      </section>
    </nav>
  );
}
