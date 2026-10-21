import { I18nKey } from "#/i18n/declaration";
import type {
  PlanningView,
  TicketAssignee,
  TicketPriority,
  TicketStatus,
} from "./types";

export const PLANNING_STORAGE_KEY = "planning-board";

export const TICKET_STATUSES: readonly TicketStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "review",
  "done",
];

export const TICKET_PRIORITIES: readonly TicketPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export const TICKET_ASSIGNEES: readonly TicketAssignee[] = ["human", "agent"];

export const PLANNING_VIEWS: readonly PlanningView[] = [
  "board",
  "sprint",
  "timeline",
];

export const STATUS_LABEL_KEYS: Record<TicketStatus, I18nKey> = {
  backlog: I18nKey.PLANNING$STATUS_BACKLOG,
  todo: I18nKey.PLANNING$STATUS_TODO,
  in_progress: I18nKey.PLANNING$STATUS_IN_PROGRESS,
  review: I18nKey.PLANNING$STATUS_REVIEW,
  done: I18nKey.PLANNING$STATUS_DONE,
};

export const PRIORITY_LABEL_KEYS: Record<TicketPriority, I18nKey> = {
  low: I18nKey.PLANNING$PRIORITY_LOW,
  medium: I18nKey.PLANNING$PRIORITY_MEDIUM,
  high: I18nKey.PLANNING$PRIORITY_HIGH,
  urgent: I18nKey.PLANNING$PRIORITY_URGENT,
};

export const ASSIGNEE_LABEL_KEYS: Record<TicketAssignee, I18nKey> = {
  human: I18nKey.PLANNING$ASSIGNEE_HUMAN,
  agent: I18nKey.PLANNING$ASSIGNEE_AGENT,
};

export const VIEW_LABEL_KEYS: Record<PlanningView, I18nKey> = {
  board: I18nKey.PLANNING$TAB_BOARD,
  sprint: I18nKey.PLANNING$TAB_SPRINT,
  timeline: I18nKey.PLANNING$TAB_TIMELINE,
};

export const DEFAULT_SPRINT_LENGTH_DAYS = 14;
