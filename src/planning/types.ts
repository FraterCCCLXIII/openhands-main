export type TicketStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "review"
  | "done";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketAssignee = "human" | "agent";

/** Calendar date as `YYYY-MM-DD`; no time zone, no time of day. */
export type IsoDate = string;

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignee: TicketAssignee;
  /** Display name of the agent when `assignee` is "agent". */
  agentLabel?: string;
  sprintId: string | null;
  startDate: IsoDate | null;
  dueDate: IsoDate | null;
  /** Story points. */
  estimate: number;
  linkedConversationId?: string;
  labels: string[];
}

export interface Sprint {
  id: string;
  name: string;
  startDate: IsoDate;
  endDate: IsoDate;
  goal: string;
}

export type PlanningView = "board" | "sprint" | "timeline";
