import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, UserPlus, X } from "lucide-react";
import { BrandButton } from "#/components/features/settings/brand-button";
import {
  TEAM_ROLES,
  TEAM_TEMPLATES,
  isTeamStageKey,
  teamStageKey,
  type TeamRoleId,
  type TeamTemplate,
} from "#/constants/factory-team-templates";
import { I18nKey } from "#/i18n/declaration";
import {
  useFeedFactoriesStore,
  type HumanAssignment,
} from "#/stores/feed-factories-store";
import type { FeedFactory } from "#/utils/feed-team-demo";
import { cn } from "#/utils/utils";
import { HUMAN_ROLE_LABEL, initialsOf } from "./human-roles";
import { InviteHumanModal } from "./invite-human-modal";
import { PIPELINE_TEMPLATES } from "./pipeline-templates";
import type { Roster } from "./factory-routing-context";
import { TeamTemplateModal } from "./team-template-modal";

const NO_ASSIGNMENTS: Record<string, HumanAssignment[]> = {};
const MEMBER_KEY = teamStageKey("member");

const findStep = (pipelineTemplateId: string, stepId: string) =>
  PIPELINE_TEMPLATES.find(
    (template) => template.id === pipelineTemplateId,
  )?.steps.find((step) => step.id === stepId);

interface TeamPerson {
  key: string;
  assignment: HumanAssignment;
}

/** Roles that have at least one person in the factory. */
const filledRoleIds = (
  assignments: Record<string, HumanAssignment[]>,
): Set<TeamRoleId> =>
  new Set(
    (Object.keys(TEAM_ROLES) as TeamRoleId[]).filter(
      (role) => (assignments[teamStageKey(role)]?.length ?? 0) > 0,
    ),
  );

interface FactoryTeamProps {
  factory: FeedFactory;
  roster: Roster;
  /** Agents added by hand; only those can be removed here. */
  removableAgents: readonly string[];
}

/** Who is in a factory, and templates for who to invite for what. */
export function FactoryTeam({
  factory,
  roster,
  removableAgents,
}: FactoryTeamProps) {
  const { t } = useTranslation("openhands");
  const assignments =
    useFeedFactoriesStore((state) => state.humanAssignments[factory.id]) ??
    NO_ASSIGNMENTS;
  const removeAssignment = useFeedFactoriesStore(
    (state) => state.removeAssignment,
  );
  const removeAgent = useFeedFactoriesStore((state) => state.removeAgent);
  const [inviting, setInviting] = useState(false);
  const [template, setTemplate] = useState<TeamTemplate | null>(null);

  const peopleRows = useMemo<TeamPerson[]>(
    () =>
      Object.entries(assignments).flatMap(([key, list]) =>
        list.map((assignment) => ({ key, assignment })),
      ),
    [assignments],
  );
  // The same person in two roles is still one person.
  const peopleCount = new Set(peopleRows.map(({ assignment }) => assignment.id))
    .size;
  const agents = [roster.coordinator, ...roster.others];
  const filled = filledRoleIds(assignments);

  const roleLabel = (key: string): string => {
    if (isTeamStageKey(key)) {
      return t(TEAM_ROLES[key.slice("team:".length) as TeamRoleId].label);
    }
    const [pipelineId, stepId] = key.split(":");
    const step = findStep(pipelineId, stepId);
    const kind = t(HUMAN_ROLE_LABEL[step?.humanRoleKind ?? "reviewer"]);
    return step ? `${kind} · ${step.title}` : kind;
  };

  return (
    <div data-testid="factory-team" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p data-testid="factory-team-summary" className="text-sm text-muted">
          {`${factory.name} · ${t(I18nKey.FACTORY$TEAM_SUMMARY, {
            people: peopleCount,
            agents: agents.length,
          })}`}
        </p>
        <BrandButton
          type="button"
          variant="primary"
          testId="factory-team-invite"
          startContent={<UserPlus size={14} aria-hidden />}
          onClick={() => setInviting(true)}
        >
          {t(I18nKey.FACTORY$TEAM_INVITE)}
        </BrandButton>
      </div>

      <section aria-labelledby="factory-team-current-heading">
        <h3
          id="factory-team-current-heading"
          className="mb-2 text-sm font-semibold text-foreground"
        >
          {t(I18nKey.FACTORY$TEAM_CURRENT)}
        </h3>
        {peopleRows.length === 0 ? (
          <p
            data-testid="factory-team-empty"
            className="mb-2 text-sm text-muted"
          >
            {t(I18nKey.FACTORY$TEAM_EMPTY)}
          </p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {peopleRows.map(({ key, assignment }) => (
            <li
              key={`${key}/${assignment.id}`}
              data-testid="factory-team-member"
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-raised text-xs font-semibold text-foreground"
              >
                {initialsOf(assignment.name)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm text-foreground">
                  {assignment.name}
                </span>
                {assignment.email && assignment.email !== assignment.name ? (
                  <span className="truncate text-xs text-muted">
                    {assignment.email}
                  </span>
                ) : null}
              </span>
              {assignment.status === "pending" ? (
                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs text-warning">
                  {t(I18nKey.FACTORY$HUMAN_ROLE_PENDING)}
                </span>
              ) : null}
              <span
                data-testid="factory-team-role-badge"
                className="rounded-full border border-border px-2 py-0.5 text-xs text-muted"
              >
                {roleLabel(key)}
              </span>
              <button
                type="button"
                aria-label={t(I18nKey.FACTORY$TEAM_REMOVE, {
                  name: assignment.name,
                })}
                onClick={() => removeAssignment(factory.id, key, assignment.id)}
                className="flex size-6 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-foreground"
              >
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
          {agents.map(({ agent }) => (
            <li
              key={agent.name}
              data-testid="factory-team-agent"
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                {agent.name}
              </span>
              <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
                {`${t(I18nKey.FACTORY$TEAM_AGENT)} · ${agent.role}`}
              </span>
              {removableAgents.includes(agent.name) ? (
                <button
                  type="button"
                  aria-label={t(I18nKey.FACTORY$TEAM_REMOVE, {
                    name: agent.name,
                  })}
                  onClick={() => removeAgent(factory.id, agent.name)}
                  className="flex size-6 items-center justify-center rounded-full text-muted hover:bg-surface-raised hover:text-foreground"
                >
                  <X size={14} aria-hidden />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="factory-team-templates-heading">
        <h3
          id="factory-team-templates-heading"
          className="text-sm font-semibold text-foreground"
        >
          {t(I18nKey.FACTORY$TEAM_TEMPLATES)}
        </h3>
        <p className="mb-3 mt-1 text-xs text-muted">
          {t(I18nKey.FACTORY$TEAM_TEMPLATES_HINT)}
        </p>
        <ul className="grid gap-3 md:grid-cols-2">
          {TEAM_TEMPLATES.map((entry) => {
            const count = entry.roles.filter(({ role }) =>
              filled.has(role),
            ).length;
            const complete = count === entry.roles.length;
            return (
              <li
                key={entry.id}
                data-testid={`team-template-${entry.id}`}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    {t(entry.name)}
                  </h4>
                  <p className="text-xs text-muted">{t(entry.description)}</p>
                </div>
                <ul className="flex flex-col gap-2">
                  {entry.roles.map(({ role, stage }) => {
                    const stageTitle = stage
                      ? findStep(stage.pipelineTemplateId, stage.stepId)?.title
                      : undefined;
                    return (
                      <li
                        key={role}
                        data-testid={`team-template-${entry.id}-role-${role}`}
                        data-filled={filled.has(role)}
                        className="flex flex-col text-xs"
                      >
                        <span className="font-medium text-foreground">
                          {t(TEAM_ROLES[role].label)}
                          {filled.has(role) ? (
                            <Check
                              size={12}
                              aria-hidden
                              className="ml-1 inline text-success"
                            />
                          ) : null}
                        </span>
                        <span className="text-muted">
                          {TEAM_ROLES[role].why
                            ? t(TEAM_ROLES[role].why)
                            : null}
                        </span>
                        <span className="text-muted">
                          {t(I18nKey.FACTORY$TEAM_JOINS, {
                            stage:
                              stageTitle ?? t(I18nKey.FACTORY$TEAM_STAGE_ANY),
                          })}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
                  <span
                    data-testid={`team-template-coverage-${entry.id}`}
                    data-tone={complete ? "ok" : "warning"}
                    className={cn(
                      "text-xs",
                      complete ? "text-success" : "text-warning",
                    )}
                  >
                    {t(I18nKey.FACTORY$HUMAN_ROLES_FILLED, {
                      filled: count,
                      total: entry.roles.length,
                    })}
                  </span>
                  <BrandButton
                    type="button"
                    variant="primary"
                    testId={`team-template-use-${entry.id}`}
                    ariaLabel={t(I18nKey.FACTORY$TEAM_USE_ARIA, {
                      name: t(entry.name),
                    })}
                    isDisabled={complete}
                    onClick={() => setTemplate(entry)}
                  >
                    {complete
                      ? t(I18nKey.FACTORY$TEAM_ALL_FILLED)
                      : t(I18nKey.FACTORY$TEAM_USE)}
                  </BrandButton>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {inviting ? (
        <InviteHumanModal
          factory={factory}
          stageKey={MEMBER_KEY}
          step={{ title: t(I18nKey.FACTORY$TEAM) }}
          roleLabel={t(TEAM_ROLES.member.label)}
          assignments={assignments[MEMBER_KEY] ?? []}
          onClose={() => setInviting(false)}
        />
      ) : null}
      {template ? (
        <TeamTemplateModal
          factory={factory}
          template={template}
          filledRoles={filled}
          onClose={() => setTemplate(null)}
        />
      ) : null}
    </div>
  );
}
