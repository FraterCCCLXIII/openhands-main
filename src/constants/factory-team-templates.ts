import { I18nKey } from "#/i18n/declaration";

/** Stable ids: they are part of the saved stage key `team:<id>`. */
export type TeamRoleId =
  | "designer"
  | "reviewer"
  | "approver"
  | "stakeholder"
  | "legal"
  | "security"
  | "incident-lead"
  | "marketing-lead"
  | "editor"
  | "member";

export interface TeamRole {
  id: TeamRoleId;
  label: I18nKey;
  /** One line on why this person matters. Absent for the generic member. */
  why?: I18nKey;
}

export const TEAM_ROLES: Record<TeamRoleId, TeamRole> = {
  designer: {
    id: "designer",
    label: I18nKey.FACTORY$TEAM_ROLE_DESIGNER,
    why: I18nKey.FACTORY$TEAM_WHY_DESIGNER,
  },
  reviewer: {
    id: "reviewer",
    label: I18nKey.FACTORY$ROLE_REVIEWER,
    why: I18nKey.FACTORY$TEAM_WHY_REVIEWER,
  },
  approver: {
    id: "approver",
    label: I18nKey.FACTORY$ROLE_APPROVER,
    why: I18nKey.FACTORY$TEAM_WHY_APPROVER,
  },
  stakeholder: {
    id: "stakeholder",
    label: I18nKey.FACTORY$TEAM_ROLE_STAKEHOLDER,
    why: I18nKey.FACTORY$TEAM_WHY_STAKEHOLDER,
  },
  legal: {
    id: "legal",
    label: I18nKey.FACTORY$TEAM_ROLE_LEGAL,
    why: I18nKey.FACTORY$TEAM_WHY_LEGAL,
  },
  security: {
    id: "security",
    label: I18nKey.FACTORY$TEAM_ROLE_SECURITY,
    why: I18nKey.FACTORY$TEAM_WHY_SECURITY,
  },
  "incident-lead": {
    id: "incident-lead",
    label: I18nKey.FACTORY$TEAM_ROLE_INCIDENT_LEAD,
    why: I18nKey.FACTORY$TEAM_WHY_INCIDENT_LEAD,
  },
  "marketing-lead": {
    id: "marketing-lead",
    label: I18nKey.FACTORY$TEAM_ROLE_MARKETING_LEAD,
    why: I18nKey.FACTORY$TEAM_WHY_MARKETING_LEAD,
  },
  editor: {
    id: "editor",
    label: I18nKey.FACTORY$TEAM_ROLE_EDITOR,
    why: I18nKey.FACTORY$TEAM_WHY_EDITOR,
  },
  member: { id: "member", label: I18nKey.FACTORY$TEAM_ROLE_MEMBER },
};

/** A pipeline gate a role typically joins: a template id and step id. */
export interface TeamRoleStage {
  pipelineTemplateId: string;
  stepId: string;
}

export interface TeamTemplateRole {
  role: TeamRoleId;
  stage?: TeamRoleStage;
}

export interface TeamTemplate {
  id: string;
  name: I18nKey;
  description: I18nKey;
  roles: TeamTemplateRole[];
}

export const TEAM_TEMPLATES: readonly TeamTemplate[] = [
  {
    id: "design-review",
    name: I18nKey.FACTORY$TEAM_TPL_DESIGN_REVIEW,
    description: I18nKey.FACTORY$TEAM_TPL_DESIGN_REVIEW_DESC,
    roles: [
      { role: "designer" },
      {
        role: "reviewer",
        stage: { pipelineTemplateId: "agentic-sdlc", stepId: "hitl1" },
      },
      { role: "stakeholder" },
    ],
  },
  {
    id: "launch",
    name: I18nKey.FACTORY$TEAM_TPL_LAUNCH,
    description: I18nKey.FACTORY$TEAM_TPL_LAUNCH_DESC,
    roles: [
      {
        role: "approver",
        stage: { pipelineTemplateId: "release-train", stepId: "signoff" },
      },
      { role: "security" },
      { role: "stakeholder" },
    ],
  },
  {
    id: "incident-response",
    name: I18nKey.FACTORY$TEAM_TPL_INCIDENT,
    description: I18nKey.FACTORY$TEAM_TPL_INCIDENT_DESC,
    roles: [
      {
        role: "incident-lead",
        stage: { pipelineTemplateId: "incident-response", stepId: "approve" },
      },
      {
        role: "reviewer",
        stage: { pipelineTemplateId: "incident-response", stepId: "post" },
      },
      { role: "stakeholder" },
    ],
  },
  {
    id: "marketing-campaign",
    name: I18nKey.FACTORY$TEAM_TPL_MARKETING,
    description: I18nKey.FACTORY$TEAM_TPL_MARKETING_DESC,
    roles: [
      { role: "marketing-lead" },
      { role: "editor" },
      { role: "approver" },
    ],
  },
  {
    id: "compliance",
    name: I18nKey.FACTORY$TEAM_TPL_COMPLIANCE,
    description: I18nKey.FACTORY$TEAM_TPL_COMPLIANCE_DESC,
    roles: [{ role: "legal" }, { role: "security" }, { role: "approver" }],
  },
  {
    id: "content-approval",
    name: I18nKey.FACTORY$TEAM_TPL_CONTENT,
    description: I18nKey.FACTORY$TEAM_TPL_CONTENT_DESC,
    roles: [{ role: "editor" }, { role: "legal" }, { role: "approver" }],
  },
];

/** Where a role is saved: the factory's team, apart from pipeline gates. */
export const teamStageKey = (role: TeamRoleId): string => `team:${role}`;

export const isTeamStageKey = (key: string): boolean => key.startsWith("team:");
