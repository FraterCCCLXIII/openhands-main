import {
  DEFAULT_CASE_BY_CASE_APPROVAL_HOURS,
  MAX_CASE_BY_CASE_APPROVAL_HOURS,
} from "@/src/lib/access-requests";

export type ApprovalStatusFilter = "pending" | "approved" | "denied";

export const APPROVALS_PAGE_COPY = {
  filterPending: "pending",
  filterApproved: "approved",
  filterDenied: "denied",
  searchPlaceholder: "Search agent requests",
  searchClearAriaLabel: "Clear search",
  selectAllMatches: "Select all matches",
  deselectMatches: "Deselect matches",
  decisionMenuLabel: "Bulk Actions",
  decideSelectedTitle: "Decide selected requests",
  decideSelectedDescription: (defaultHours: number, maxHours: number) =>
    `Approvals default to ${defaultHours} hours and can last up to ${maxHours} hours.`,
  approveModalAriaLabel: "Approve selected requests",
  cancel: "Cancel",
  confirmApprove: "Approve",
  selectedCount: (count: number) => `${count} selected`,
  durationLabel: "Duration",
  durationAriaLabel: "Approval duration in hours",
  hoursLabel: "hours",
  longDurationHintPrefix:
    "If you want to approve for more than 100 hours, change the setting to case-by-case on the",
  longDurationHintLink: "integrations page",
  longDurationHintSuffix: ".",
  approveSelected: "Approve selected",
  denySelected: "Deny selected",
  approveRequestLabel: "Approve",
  denyRequestLabel: "Deny",
  approveRequestAriaLabel: (toolName: string, integrationKey: string) =>
    `Approve ${toolName} on ${integrationKey}`,
  denyRequestAriaLabel: (toolName: string, integrationKey: string) =>
    `Deny ${toolName} on ${integrationKey}`,
  tableColumnSelect: "Select",
  tableColumnIntegration: "Integration",
  tableColumnTool: "Tool",
  tableColumnInvocationIdentity: "Invocation identity",
  tableColumnConversation: "Conversation",
  tableColumnRequested: "Requested",
  tableColumnRequestedDuration: "Duration",
  tableColumnDecidedBy: "Decided by",
  tableColumnDecidedAt: "Decided at",
  tableColumnScopes: "Scopes",
  tableColumnActions: "Actions",
  tableMissingIdentityHint: "no agent identity provided",
  tableDefaultScopes: "default scopes",
  emptyState: (filter: ApprovalStatusFilter) =>
    `No ${filter} approval requests match the current search.`,
} as const;

export const APPROVAL_DURATION = {
  defaultHours: DEFAULT_CASE_BY_CASE_APPROVAL_HOURS,
  minHours: 1,
  maxHours: MAX_CASE_BY_CASE_APPROVAL_HOURS,
} as const;
