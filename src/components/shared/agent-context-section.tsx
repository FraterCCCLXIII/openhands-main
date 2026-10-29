import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { getDisplayConversationTags } from "#/api/agent-server-adapter";
import { useActiveConversation } from "#/hooks/query/use-active-conversation";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useConversationSkills } from "#/hooks/query/use-conversation-skills";
import { useOptionalConversationId } from "#/hooks/use-conversation-id";
import { useGoalStore } from "#/stores/goal-store";

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
  const rows: [string, string | undefined][] = [
    [I18nKey.FEED$DETAILS_AGENT_PROFILE, profileName],
    [I18nKey.FEED$DETAILS_MODEL, conversation.llm_model ?? undefined],
    [I18nKey.FEED$DETAILS_TAGS, tags.join(", ") || undefined],
    [
      I18nKey.FEED$DETAILS_WORKSPACE,
      conversation.workspace?.working_dir ?? undefined,
    ],
    [
      I18nKey.FEED$DETAILS_SKILLS_AVAILABLE,
      skills?.length
        ? `${skills
            .slice(0, MAX_SKILLS)
            .map((skill) => skill.name)
            .join(
              ", ",
            )}${skills.length > MAX_SKILLS ? ` +${skills.length - MAX_SKILLS}` : ""}`
        : undefined,
    ],
    [
      I18nKey.FEED$DETAILS_GOAL,
      goal
        ? `${goal.objective} · ${t(I18nKey.FEED$DETAILS_GOAL_PROGRESS, {
            iteration: goal.iteration,
            max: goal.max_iterations,
          })}`
        : undefined,
    ],
  ];
  return (
    <dl className="custom-scrollbar max-h-40 overflow-auto">
      {rows.map(([label, value]) =>
        value ? (
          <div key={label} className="flex gap-1.5">
            <dt className="flex-shrink-0 font-semibold">{t(label)}:</dt>
            <dd className="break-words">{value}</dd>
          </div>
        ) : null,
      )}
    </dl>
  );
}

/** What the conversation's agent was set up with. Loads only when opened. */
export function AgentContextSection() {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <button
        type="button"
        data-testid="agent-context-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="cursor-pointer font-semibold hover:text-foreground"
      >
        {t(I18nKey.FEED$DETAILS_AGENT_CONTEXT)}
      </button>
      {open ? <AgentContextRows /> : null}
    </div>
  );
}
