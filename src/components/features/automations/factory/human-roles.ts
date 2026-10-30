import {
  DEFAULT_HUMAN_ROLES,
  clampHumanRoles,
} from "#/constants/factory-human-roles";
import { I18nKey } from "#/i18n/declaration";
import type { HumanAssignment } from "#/stores/feed-factories-store";
import type {
  HumanRoleKind,
  PipelineStep,
  PipelineTemplate,
} from "./pipeline-templates";

/** The slot name shown for each kind of gate. */
export const HUMAN_ROLE_LABEL: Record<HumanRoleKind, I18nKey> = {
  reviewer: I18nKey.FACTORY$ROLE_REVIEWER,
  approver: I18nKey.FACTORY$ROLE_APPROVER,
  signer: I18nKey.FACTORY$ROLE_SIGNER,
};

/** Steps of a template where a person must act. */
export const humanGates = (template: PipelineTemplate): PipelineStep[] =>
  template.steps.filter((step) => step.humanInTheLoop);

/** Stages are keyed by template too: step ids repeat across templates. */
export const stageKey = (templateId: string, stepId: string): string =>
  `${templateId}:${stepId}`;

/** People a gate needs: what the factory saved, else the stage default. */
export const requiredHumanRoles = (
  step: PipelineStep,
  saved: number | undefined,
  filled: number,
): number =>
  clampHumanRoles(
    saved ?? step.defaultHumanRoles ?? DEFAULT_HUMAN_ROLES,
    filled,
  );

/** Roles still open across a set of gates. */
export const openHumanRoles = (
  steps: PipelineStep[],
  templateId: string,
  counts: Record<string, number> | undefined,
  assignments: Record<string, HumanAssignment[]> | undefined,
): number =>
  steps.reduce((open, step) => {
    const key = stageKey(templateId, step.id);
    const filled = assignments?.[key]?.length ?? 0;
    return (
      open +
      Math.max(0, requiredHumanRoles(step, counts?.[key], filled) - filled)
    );
  }, 0);

// Light on purpose: one "@", no spaces, a dot in the domain.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export const normalizeEmail = (value: string): string =>
  value.trim().toLowerCase();

export const isValidEmail = (value: string): boolean =>
  EMAIL_PATTERN.test(normalizeEmail(value));

export const initialsOf = (name: string): string => {
  const parts = name.split(/[\s@._-]+/).filter(Boolean);
  const letters =
    parts.length > 1
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`
      : (parts[0] ?? "").slice(0, 2);
  return letters.toUpperCase();
};

/** Where the invited person can open the factory. */
export const factoryLink = (factoryId: string): string =>
  `${window.location.origin}/automations/factories/${encodeURIComponent(factoryId)}/pipeline`;

/** A `mailto:` link for the user's own mail app; nothing is sent from here. */
export const buildMailto = (
  email: string,
  subject: string,
  body: string,
): string =>
  `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
