/**
 * The one place that decides how many people a human-in-the-loop pipeline
 * gate asks for. A step can carry its own `defaultHumanRoles`; a factory can
 * override either with a count it saves.
 */
export const DEFAULT_HUMAN_ROLES = 1;
export const MIN_HUMAN_ROLES = 1;
export const MAX_HUMAN_ROLES = 5;

/** Keeps a requested count inside the allowed range of whole people. */
export const clampHumanRoles = (count: number, floor = MIN_HUMAN_ROLES) =>
  Math.min(
    MAX_HUMAN_ROLES,
    Math.max(MIN_HUMAN_ROLES, floor, Math.round(count)),
  );
