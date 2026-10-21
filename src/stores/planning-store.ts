import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";
import {
  DEFAULT_SPRINT_LENGTH_DAYS,
  PLANNING_STORAGE_KEY,
} from "#/planning/constants";
import { addDays, todayIso } from "#/planning/dates";
import { createSeedData } from "#/planning/seed";
import type { Sprint, Ticket, TicketStatus } from "#/planning/types";

export type NewTicketInput = Pick<Ticket, "title"> &
  Partial<Omit<Ticket, "id">>;
export type NewSprintInput = Partial<Omit<Sprint, "id">>;

interface PlanningState {
  tickets: Ticket[];
  sprints: Sprint[];
}

interface PlanningActions {
  createTicket: (input: NewTicketInput) => Ticket;
  updateTicket: (id: string, patch: Partial<Omit<Ticket, "id">>) => void;
  moveTicket: (id: string, status: TicketStatus) => void;
  deleteTicket: (id: string) => void;
  createSprint: (input?: NewSprintInput) => Sprint;
}

export type PlanningStore = PlanningState & PlanningActions;

/**
 * localStorage is per-viewer and may be missing or throw (private windows,
 * blocked site data), so every access degrades to in-memory state.
 */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Persistence is best effort.
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Persistence is best effort.
    }
  },
};

function nextId(prefix: "T" | "S", ids: readonly string[]): string {
  const highest = ids.reduce((max, id) => {
    const value = Number(id.slice(prefix.length + 1));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `${prefix}-${highest + 1}`;
}

export const usePlanningStore = create<PlanningStore>()(
  persist(
    (set, get) => ({
      ...createSeedData(todayIso()),

      createTicket: (input) => {
        const ticket: Ticket = {
          description: "",
          status: "backlog",
          priority: "medium",
          assignee: "human",
          sprintId: null,
          startDate: null,
          dueDate: null,
          estimate: 1,
          labels: [],
          ...input,
          id: nextId(
            "T",
            get().tickets.map((t) => t.id),
          ),
        };
        set((state) => ({ tickets: [...state.tickets, ticket] }));
        return ticket;
      },

      updateTicket: (id, patch) =>
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id ? { ...ticket, ...patch } : ticket,
          ),
        })),

      moveTicket: (id, status) => get().updateTicket(id, { status }),

      deleteTicket: (id) =>
        set((state) => ({
          tickets: state.tickets.filter((ticket) => ticket.id !== id),
        })),

      createSprint: (input = {}) => {
        const { sprints } = get();
        const lastEnd = sprints.reduce<string | null>(
          (latest, sprint) =>
            latest === null || sprint.endDate > latest
              ? sprint.endDate
              : latest,
          null,
        );
        const startDate =
          input.startDate ?? (lastEnd ? addDays(lastEnd, 1) : todayIso());
        const id = nextId(
          "S",
          sprints.map((s) => s.id),
        );
        const sprint: Sprint = {
          name: id,
          endDate: addDays(startDate, DEFAULT_SPRINT_LENGTH_DAYS - 1),
          goal: "",
          ...input,
          startDate,
          id,
        };
        set((state) => ({ sprints: [...state.sprints, sprint] }));
        return sprint;
      },
    }),
    {
      name: PLANNING_STORAGE_KEY,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state): PlanningState => ({
        tickets: state.tickets,
        sprints: state.sprints,
      }),
    },
  ),
);
