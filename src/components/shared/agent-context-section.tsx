import React from "react";
import { Bot, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { getDisplayConversationTags } from "#/api/agent-server-adapter";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useConversationSkills } from "#/hooks/query/use-conversation-skills";
import { useOptionalConversationId } from "#/hooks/use-conversation-id";
import { useGoalStore } from "#/stores/goal-store";
import { cn } from "#/utils/utils";
import { Chip } from "./turn-details/chip";

const MAX_SKILLS = 8;

function AgentContextRows() {
  const { t } = useTranslation("openhands");
  const { conversationId } = useOptionalConversationId();
  const { data: conversation } = useActiveConversation();
  const { data: profileData } = useAgentProfiles();
  const { data: skills } = useConversationSkills();
  const goal = useGoalStore((state) =>
    conversationId ? state.statusByConversation[conversationId] : undefined,
  );
  if (!conversation) return null;

  const profileId = conversation.launched_agent_profile?.agent_profile_id;
  const profileName = profileId
    ? (profileData?.profiles.find((profile) => profile.id === profileId)
        ?.name ?? profileId)
    : undefined;
  const tags = getDisplayConversationTags(conversation.tags).map(
    ([key, value]) => (value ? `${key}=${value}` : key),
  );
  const chips: { label: string; values: string[] }[] = [
    { label: I18nKey.FEED$DETAILS_AGENT_PROFILE, values: [profileName ?? ""] },
    {
      label: I18nKey.FEED$DETAILS_MODEL,
      values: [conversation.llm_model ?? ""],
    },
    { label: I18nKey.FEED$DETAILS_TAGS, values: tags },
    {
      label: I18nKey.FEED$DETAILS_WORKSPACE,
      values: [conversation.workspace?.working_dir ?? ""],
    },
    {
      label: I18nKey.FEED$DETAILS_SKILLS_AVAILABLE,
      values: [
        ...(skills ?? []).slice(0, MAX_SKILLS).map((skill) => skill.name),
        ...(skills && skills.length > MAX_SKILLS
          ? [`+${skills.length - MAX_SKILLS}`]
          : []),
      ],
    },
    {
      label: I18nKey.FEED$DETAILS_GOAL,
      values: [
        goal
          ? `${goal.objective} · ${t(I18nKey.FEED$DETAILS_GOAL_PROGRESS, {
              iteration: goal.iteration,
              max: goal.max_iterations,
            })}`
          : "",
      ],
    },
  ];
  return (
    <dl className="custom-scrollbar flex max-h-48 flex-col gap-1.5 overflow-auto">
      {chips.map(({ label, values }) => {
        const shown = values.filter(Boolean);
        return shown.length ? (
          <div key={label} className="flex flex-col gap-1">
            <dt className="text-xs uppercase tracking-wider text-muted">
              {t(label)}
            </dt>
            <dd className="flex flex-wrap gap-1.5">
              {shown.map((value) => (
                <Chip
                  key={value}
                  mono={label === I18nKey.FEED$DETAILS_WORKSPACE}
                >
                  {value}
                </Chip>
              ))}
            </dd>
          </div>
        ) : null;
      })}
    </dl>
  );
}

/** What the conversation's agent was set up with. Loads only when opened. */
export function AgentContextSection() {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);
  return (
    <section
      data-testid="turn-details-module"
      className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-border bg-surface p-2.5 @lg:col-span-2"
    >
      <button
        type="button"
        data-testid="agent-context-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full cursor-pointer items-center gap-1.5 text-muted transition-colors hover:text-foreground"
      >
        <Bot className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 truncate text-left text-xs font-semibold uppercase tracking-wider">
          {t(I18nKey.FEED$DETAILS_AGENT_CONTEXT)}
        </span>
        <ChevronDown
          className={cn(
            "h-3 w-3 flex-shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="text-xs text-foreground">
          <AgentContextRows />
        </div>
      ) : null}
    </section>
  );
}
