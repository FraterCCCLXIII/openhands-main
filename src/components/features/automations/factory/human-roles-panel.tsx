import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Minus, Plus, UserPlus, X } from "lucide-react";
import {
  MAX_HUMAN_ROLES,
  MIN_HUMAN_ROLES,
} from "#/constants/factory-human-roles";
import { I18nKey } from "#/i18n/declaration";
import {
  useFeedFactoriesStore,
  type HumanAssignment,
} from "#/stores/feed-factories-store";
import { getFeedPerson, type FeedFactory } from "#/utils/feed-team-demo";
import { pickFeedTint } from "#/utils/feed-demo-agents";
import { cn } from "#/utils/utils";
import {
  HUMAN_ROLE_LABEL,
  humanGates,
  initialsOf,
  openHumanRoles,
  requiredHumanRoles,
  stageKey,
} from "./human-roles";
import { InviteHumanModal } from "./invite-human-modal";
import type { PipelineStep, PipelineTemplate } from "./pipeline-templates";

const NO_ASSIGNMENTS: HumanAssignment[] = [];

function Avatar({ assignment }: { assignment: HumanAssignment }) {
  const tint = assignment.personId
    ? (getFeedPerson(assignment.personId)?.className ??
      pickFeedTint(assignment.id))
    : pickFeedTint(assignment.id);
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        tint,
      )}
    >
      {initialsOf(assignment.name)}
    </span>
  );
}

interface StageRolesProps {
  factory: FeedFactory;
  templateId: string;
  step: PipelineStep;
}

/** One gate: its stepper, summary and a chip for each required person. */
function StageRoles({ factory, templateId, step }: StageRolesProps) {
  const { t } = useTranslation("openhands");
  const key = stageKey(templateId, step.id);
  const assignments =
    useFeedFactoriesStore(
      (state) => state.humanAssignments[factory.id]?.[key],
    ) ?? NO_ASSIGNMENTS;
  const saved = useFeedFactoriesStore(
    (state) => state.humanRoleCounts[factory.id]?.[key],
  );
  const setCount = useFeedFactoriesStore((state) => state.setHumanRoleCount);
  const removeAssignment = useFeedFactoriesStore(
    (state) => state.removeAssignment,
  );
  const [inviting, setInviting] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const filled = assignments.length;
  const total = requiredHumanRoles(step, saved, filled);
  const empty = total - filled;
  const role = t(HUMAN_ROLE_LABEL[step.humanRoleKind ?? "reviewer"]);
  const lowerBlocked = total <= Math.max(MIN_HUMAN_ROLES, filled);

  // When the invite modal closes and the button that opened it is gone (the
  // slot filled), keep keyboard focus in this stage rather than on the page.
  useEffect(() => {
    if (!inviting && document.activeElement === document.body) {
      sectionRef.current?.focus();
    }
  }, [inviting]);

  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      data-testid={`human-roles-stage-${step.id}`}
      aria-label={step.title}
      className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 outline-none"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-medium text-foreground">
            {step.title}
          </span>
          <span
            data-testid={`human-roles-summary-${step.id}`}
            data-tone={empty > 0 ? "warning" : "ok"}
            className={cn(
              "text-xs",
              empty > 0 ? "text-warning" : "text-success",
            )}
          >
            {t(I18nKey.FACTORY$HUMAN_ROLES_FILLED, { filled, total })}
          </span>
        </div>
        <div
          role="group"
          aria-label={t(I18nKey.FACTORY$HUMAN_ROLES_COUNT, {
            stage: step.title,
          })}
          className="flex items-center gap-1"
        >
          <button
            type="button"
            data-testid={`human-roles-decrease-${step.id}`}
            aria-label={t(I18nKey.FACTORY$HUMAN_ROLES_DECREASE, {
              stage: step.title,
            })}
            title={
              lowerBlocked && filled >= total
                ? t(I18nKey.FACTORY$HUMAN_ROLES_MIN_TOOLTIP)
                : undefined
            }
            disabled={lowerBlocked}
            onClick={() => setCount(factory.id, key, total - 1)}
            className="flex size-6 items-center justify-center rounded border border-border text-muted hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Minus size={12} aria-hidden />
          </button>
          <output
            data-testid={`human-roles-count-${step.id}`}
            className="min-w-5 text-center font-mono text-sm text-foreground"
          >
            {total}
          </output>
          <button
            type="button"
            data-testid={`human-roles-increase-${step.id}`}
            aria-label={t(I18nKey.FACTORY$HUMAN_ROLES_INCREASE, {
              stage: step.title,
            })}
            disabled={total >= MAX_HUMAN_ROLES}
            onClick={() => setCount(factory.id, key, total + 1)}
            className="flex size-6 items-center justify-center rounded border border-border text-muted hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={12} aria-hidden />
          </button>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2">
        {assignments.map((assignment) => (
          <li
            key={assignment.id}
            data-testid={`human-role-slot-${assignment.status}`}
            className="flex items-center gap-2 rounded-full border border-border bg-surface-raised py-1 pl-1 pr-2 text-xs"
          >
            <Avatar assignment={assignment} />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-foreground">
                {assignment.name}
                <span className="text-muted">{` · ${role}`}</span>
              </span>
              {assignment.status === "pending" ? (
                <span className="flex items-center gap-1 text-muted">
                  <span className="rounded-full bg-warning/10 px-1.5 text-warning">
                    {t(I18nKey.FACTORY$HUMAN_ROLE_PENDING)}
                  </span>
                  {assignment.email !== assignment.name ? (
                    <span className="truncate">{assignment.email}</span>
                  ) : null}
                </span>
              ) : null}
            </span>
            <button
              type="button"
              aria-label={t(I18nKey.FACTORY$HUMAN_ROLE_REMOVE, {
                name: assignment.name,
                stage: step.title,
              })}
              onClick={() => removeAssignment(factory.id, key, assignment.id)}
              className="flex size-5 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground"
            >
              <X size={12} aria-hidden />
            </button>
          </li>
        ))}
        {Array.from({ length: Math.max(0, empty) }, (_, index) => (
          <li key={`empty-${filled + index}`}>
            <button
              type="button"
              data-testid="human-role-slot-empty"
              aria-label={t(I18nKey.FACTORY$HUMAN_ROLE_INVITE_FOR, {
                role,
                stage: step.title,
              })}
              onClick={() => setInviting(true)}
              className="flex items-center gap-1.5 rounded-full border border-dashed border-warning/60 px-3 py-1.5 text-xs text-warning hover:bg-warning/10"
            >
              <UserPlus size={12} aria-hidden />
              {t(I18nKey.FACTORY$HUMAN_ROLE_INVITE)}
              <span className="text-muted">{`· ${role}`}</span>
            </button>
          </li>
        ))}
      </ul>
      {inviting ? (
        <InviteHumanModal
          factory={factory}
          stageKey={key}
          step={step}
          assignments={assignments}
          onClose={() => setInviting(false)}
        />
      ) : null}
    </section>
  );
}

interface HumanRolesPanelProps {
  factory: FeedFactory;
  template: PipelineTemplate;
}

/** The people each human-in-the-loop gate of a pipeline asks for. */
export function HumanRolesPanel({ factory, template }: HumanRolesPanelProps) {
  const { t } = useTranslation("openhands");
  const gates = humanGates(template);
  const counts = useFeedFactoriesStore(
    (state) => state.humanRoleCounts[factory.id],
  );
  const assignments = useFeedFactoriesStore(
    (state) => state.humanAssignments[factory.id],
  );
  if (gates.length === 0) return null;
  const open = openHumanRoles(gates, template.id, counts, assignments);

  return (
    <section
      data-testid="human-roles-panel"
      aria-label={t(I18nKey.FACTORY$HUMAN_ROLES_TITLE)}
      className="flex flex-col gap-2 rounded-xl border border-border bg-surface-raised px-4 py-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t(I18nKey.FACTORY$HUMAN_ROLES_TITLE)}
        </h3>
        <span
          data-testid="human-roles-open"
          data-tone={open > 0 ? "warning" : "ok"}
          className={cn("text-xs", open > 0 ? "text-warning" : "text-success")}
        >
          {open > 0
            ? t(I18nKey.FACTORY$HUMAN_ROLES_OPEN, { count: open })
            : t(I18nKey.FACTORY$HUMAN_ROLES_ALL_FILLED)}
        </span>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {gates.map((step) => (
          <StageRoles
            key={stageKey(template.id, step.id)}
            factory={factory}
            templateId={template.id}
            step={step}
          />
        ))}
      </div>
    </section>
  );
}
