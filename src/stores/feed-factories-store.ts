import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { clampHumanRoles } from "#/constants/factory-human-roles";

/** A factory someone created, saved beside the built-in simulated ones. */
export interface CustomFactory {
  id: string;
  name: string;
  description: string;
  /** Id of the simulated teammate who owns it. */
  ownerId: string;
}

/** A conversation placed in a factory with an agent, overriding the default. */
export interface ConversationAssignment {
  factoryId: string;
  agentName: string;
}

/**
 * A person filling one human role at a pipeline stage: a teammate already
 * known to the app, or an email invite that is only saved. Nothing is ever
 * sent for an invite; "pending" means the person has not been added yet.
 */
export interface HumanAssignment {
  /** `person:<id>` or `email:<address>`; unique within a stage. */
  id: string;
  status: "assigned" | "pending";
  name: string;
  /** Set for a teammate. */
  personId?: string;
  /** Set for a pending invite (trimmed, lower-case). */
  email?: string;
}

export const personAssignmentId = (personId: string) => `person:${personId}`;
export const emailAssignmentId = (email: string) => `email:${email}`;

interface FeedFactoriesState {
  custom: CustomFactory[];
  /** Conversations the factory inbox started or placed, by conversation id. */
  assignments: Record<string, ConversationAssignment>;
  /** The pipeline template each factory uses, by factory id. */
  templates: Record<string, string>;
  /** Agents added to a factory by hand, by factory id (agent names). */
  addedAgents: Record<string, string[]>;
  /** The agent that coordinates a factory, when it is not the default. */
  coordinators: Record<string, string>;
  /**
   * Skills switched off for one factory, by factory id. A deny-list, so a
   * skill installed later follows the global setting until someone turns it
   * off here.
   */
  disabledSkills: Record<string, string[]>;
  /** Ids of the automations attached to a factory, by factory id. */
  automationIds: Record<string, string[]>;
  /**
   * How many people a human-in-the-loop stage needs, by factory id then
   * stage key. Only stages someone changed; others use the stage default.
   */
  humanRoleCounts: Record<string, Record<string, number>>;
  /** People and pending invites at each stage, by factory id then stage key. */
  humanAssignments: Record<string, Record<string, HumanAssignment[]>>;
}

interface FeedFactoriesActions {
  addFactory: (factory: CustomFactory) => void;
  assignConversation: (
    conversationId: string,
    assignment: ConversationAssignment,
  ) => void;
  setTemplate: (factoryId: string, templateId: string) => void;
  addAgent: (factoryId: string, agentName: string) => void;
  removeAgent: (factoryId: string, agentName: string) => void;
  setCoordinator: (factoryId: string, agentName: string) => void;
  setSkillEnabled: (
    factoryId: string,
    skillName: string,
    enabled: boolean,
  ) => void;
  attachAutomation: (factoryId: string, automationId: string) => void;
  detachAutomation: (factoryId: string, automationId: string) => void;
  /** Never goes below the people already filling the stage. */
  setHumanRoleCount: (
    factoryId: string,
    stageId: string,
    count: number,
  ) => void;
  assignPerson: (
    factoryId: string,
    stageId: string,
    person: { id: string; name: string },
  ) => void;
  /** Saves a pending invite. Does not contact anyone. */
  inviteByEmail: (
    factoryId: string,
    stageId: string,
    invite: { email: string; name?: string },
  ) => void;
  removeAssignment: (
    factoryId: string,
    stageId: string,
    assignmentId: string,
  ) => void;
  /** Forgets a factory and everything saved for it. */
  deleteFactory: (factoryId: string) => void;
  /** Follows a renamed agent profile through every factory it is in. */
  renameAgent: (from: string, to: string) => void;
  /** Takes a deleted agent profile out of every factory. */
  forgetAgent: (agentName: string) => void;
}

const withoutKey = <T>(
  record: Record<string, T>,
  key: string,
): Record<string, T> => {
  const { [key]: _removed, ...rest } = record;
  return rest;
};

const addAssignment = (
  state: FeedFactoriesState,
  factoryId: string,
  stageId: string,
  assignment: HumanAssignment,
): Pick<FeedFactoriesState, "humanAssignments"> | FeedFactoriesState => {
  const forFactory = state.humanAssignments?.[factoryId] ?? {};
  const current = forFactory[stageId] ?? [];
  if (current.some((existing) => existing.id === assignment.id)) return state;
  return {
    humanAssignments: {
      ...state.humanAssignments,
      [factoryId]: { ...forFactory, [stageId]: [...current, assignment] },
    },
  };
};

const withMember = (
  list: string[] | undefined,
  value: string,
  present: boolean,
): string[] => {
  const current = list ?? [];
  if (current.includes(value) === present) return current;
  return present ? [...current, value] : current.filter((v) => v !== value);
};

/** Owns the factories people add; every factory list reads from here. */
export const useFeedFactoriesStore = create<
  FeedFactoriesState & FeedFactoriesActions
>()(
  persist(
    (set) => ({
      custom: [],
      assignments: {},
      templates: {},
      addedAgents: {},
      coordinators: {},
      disabledSkills: {},
      automationIds: {},
      humanRoleCounts: {},
      humanAssignments: {},
      setHumanRoleCount: (factoryId, stageId, count) =>
        set((state) => {
          const filled =
            state.humanAssignments?.[factoryId]?.[stageId]?.length ?? 0;
          return {
            humanRoleCounts: {
              ...state.humanRoleCounts,
              [factoryId]: {
                ...state.humanRoleCounts?.[factoryId],
                [stageId]: clampHumanRoles(count, filled),
              },
            },
          };
        }),
      assignPerson: (factoryId, stageId, person) =>
        set((state) =>
          addAssignment(state, factoryId, stageId, {
            id: personAssignmentId(person.id),
            status: "assigned",
            name: person.name,
            personId: person.id,
          }),
        ),
      inviteByEmail: (factoryId, stageId, invite) =>
        set((state) => {
          const email = invite.email.trim().toLowerCase();
          return addAssignment(state, factoryId, stageId, {
            id: emailAssignmentId(email),
            status: "pending",
            name: invite.name?.trim() || email,
            email,
          });
        }),
      removeAssignment: (factoryId, stageId, assignmentId) =>
        set((state) => {
          const forFactory = state.humanAssignments?.[factoryId];
          if (!forFactory?.[stageId]) return state;
          return {
            humanAssignments: {
              ...state.humanAssignments,
              [factoryId]: {
                ...forFactory,
                [stageId]: forFactory[stageId].filter(
                  (assignment) => assignment.id !== assignmentId,
                ),
              },
            },
          };
        }),
      renameAgent: (from, to) =>
        set((state) => {
          if (from === to) return state;
          const swap = (names: string[]) =>
            names.includes(from)
              ? [...new Set(names.map((name) => (name === from ? to : name)))]
              : names;
          return {
            addedAgents: Object.fromEntries(
              Object.entries(state.addedAgents).map(([id, names]) => [
                id,
                swap(names),
              ]),
            ),
            coordinators: Object.fromEntries(
              Object.entries(state.coordinators).map(([id, name]) => [
                id,
                name === from ? to : name,
              ]),
            ),
            assignments: Object.fromEntries(
              Object.entries(state.assignments).map(([id, a]) => [
                id,
                a.agentName === from ? { ...a, agentName: to } : a,
              ]),
            ),
          };
        }),
      forgetAgent: (agentName) =>
        set((state) => ({
          addedAgents: Object.fromEntries(
            Object.entries(state.addedAgents).map(([id, names]) => [
              id,
              names.filter((name) => name !== agentName),
            ]),
          ),
          // A factory whose coordinator is gone falls back to its default.
          coordinators: Object.fromEntries(
            Object.entries(state.coordinators).filter(
              ([, name]) => name !== agentName,
            ),
          ),
        })),
      deleteFactory: (factoryId) =>
        set((state) => ({
          custom: state.custom.filter((factory) => factory.id !== factoryId),
          templates: withoutKey(state.templates, factoryId),
          addedAgents: withoutKey(state.addedAgents, factoryId),
          coordinators: withoutKey(state.coordinators, factoryId),
          disabledSkills: withoutKey(state.disabledSkills, factoryId),
          automationIds: withoutKey(state.automationIds, factoryId),
          humanRoleCounts: withoutKey(state.humanRoleCounts ?? {}, factoryId),
          humanAssignments: withoutKey(state.humanAssignments ?? {}, factoryId),
        })),
      setSkillEnabled: (factoryId, skillName, enabled) =>
        set((state) => ({
          disabledSkills: {
            ...state.disabledSkills,
            [factoryId]: withMember(
              state.disabledSkills[factoryId],
              skillName,
              !enabled,
            ),
          },
        })),
      attachAutomation: (factoryId, automationId) =>
        set((state) => ({
          automationIds: {
            ...state.automationIds,
            [factoryId]: withMember(
              state.automationIds[factoryId],
              automationId,
              true,
            ),
          },
        })),
      detachAutomation: (factoryId, automationId) =>
        set((state) => ({
          automationIds: {
            ...state.automationIds,
            [factoryId]: withMember(
              state.automationIds[factoryId],
              automationId,
              false,
            ),
          },
        })),
      addAgent: (factoryId, agentName) =>
        set((state) => {
          const current = state.addedAgents[factoryId] ?? [];
          if (current.includes(agentName)) return state;
          return {
            addedAgents: {
              ...state.addedAgents,
              [factoryId]: [...current, agentName],
            },
          };
        }),
      removeAgent: (factoryId, agentName) =>
        set((state) => ({
          addedAgents: {
            ...state.addedAgents,
            [factoryId]: (state.addedAgents[factoryId] ?? []).filter(
              (name) => name !== agentName,
            ),
          },
        })),
      setCoordinator: (factoryId, agentName) =>
        set((state) => ({
          coordinators: { ...state.coordinators, [factoryId]: agentName },
        })),
      setTemplate: (factoryId, templateId) =>
        set((state) => ({
          templates: { ...state.templates, [factoryId]: templateId },
        })),
      addFactory: (factory) =>
        set((state) => ({ custom: [...state.custom, factory] })),
      assignConversation: (conversationId, assignment) =>
        set((state) => ({
          assignments: { ...state.assignments, [conversationId]: assignment },
        })),
    }),
    {
      name: "feed-factories",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // Every earlier shape is a subset of this one; `merge` fills the rest.
      migrate: (persisted) => persisted as FeedFactoriesState,
      // Fill the maps older saves lack so every reader sees a complete state.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<FeedFactoriesState>;
        return {
          ...current,
          ...saved,
          custom: Array.isArray(saved.custom) ? saved.custom : [],
          assignments: saved.assignments ?? {},
          templates: saved.templates ?? {},
          addedAgents: saved.addedAgents ?? {},
          coordinators: saved.coordinators ?? {},
          disabledSkills: saved.disabledSkills ?? {},
          automationIds: saved.automationIds ?? {},
          humanRoleCounts: saved.humanRoleCounts ?? {},
          humanAssignments: saved.humanAssignments ?? {},
        };
      },
    },
  ),
);
