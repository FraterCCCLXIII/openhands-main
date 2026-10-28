import { addDays } from "./dates";
import type { IsoDate, Sprint, Ticket } from "./types";

export interface PlanningData {
  tickets: Ticket[];
  sprints: Sprint[];
}

/** Sample data anchored to `today` so the board and timeline look current. */
export function createSeedData(today: IsoDate): PlanningData {
  const sprints: Sprint[] = [
    {
      id: "S-1",
      name: "Sprint 1",
      startDate: addDays(today, -7),
      endDate: addDays(today, 6),
      goal: "Ship the first agent-driven workflow end to end",
    },
    {
      id: "S-2",
      name: "Sprint 2",
      startDate: addDays(today, 7),
      endDate: addDays(today, 20),
      goal: "Harden the workflow and cover edge cases",
    },
  ];
  const base = {
    description: "",
    labels: [] as string[],
    assignee: "human" as const,
  };
  const tickets: Ticket[] = [
    {
      ...base,
      id: "T-1",
      title: "Design the onboarding checklist",
      status: "done",
      priority: "medium",
      sprintId: "S-1",
      startDate: addDays(today, -7),
      dueDate: addDays(today, -3),
      estimate: 3,
      labels: ["design"],
    },
    {
      ...base,
      id: "T-2",
      title: "Implement the settings migration",
      description: "Migrate stored settings to the new schema.",
      status: "in_progress",
      priority: "high",
      assignee: "agent",
      agentLabel: "OpenHands",
      sprintId: "S-1",
      startDate: addDays(today, -4),
      dueDate: addDays(today, 2),
      estimate: 5,
      linkedConversationId: "demo-conversation",
      labels: ["backend"],
    },
    {
      ...base,
      id: "T-3",
      title: "Review the migration pull request",
      status: "review",
      priority: "high",
      sprintId: "S-1",
      startDate: addDays(today, 1),
      dueDate: addDays(today, 4),
      estimate: 2,
    },
    {
      ...base,
      id: "T-4",
      title: "Add retry handling to uploads",
      status: "todo",
      priority: "urgent",
      assignee: "agent",
      agentLabel: "OpenHands",
      sprintId: "S-2",
      startDate: addDays(today, 8),
      dueDate: addDays(today, 12),
      estimate: 3,
      labels: ["reliability"],
    },
    {
      ...base,
      id: "T-5",
      title: "Write release notes",
      status: "backlog",
      priority: "low",
      sprintId: null,
      startDate: null,
      dueDate: null,
      estimate: 1,
    },
  ];
  return { tickets, sprints };
}
