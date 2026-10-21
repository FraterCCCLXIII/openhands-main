import { create } from "zustand";
import {
  persist,
  createJSONStorage,
  type StateStorage,
} from "zustand/middleware";
import {
  KANBAN_STORAGE_KEY,
  type KanbanCard,
  type KanbanColumnId,
} from "#/kanban/constants";

interface KanbanState {
  cards: KanbanCard[];
}

interface KanbanActions {
  addCard: (title: string) => void;
  moveCard: (id: string, column: KanbanColumnId) => void;
  deleteCard: (id: string) => void;
}

export type KanbanStore = KanbanState & KanbanActions;

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

export const useKanbanStore = create<KanbanStore>()(
  persist(
    (set) => ({
      cards: [],
      addCard: (title) => {
        const trimmed = title.trim();
        if (!trimmed) return;
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        set((state) => ({
          cards: [...state.cards, { id, title: trimmed, column: "todo" }],
        }));
      },
      moveCard: (id, column) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.id === id ? { ...card, column } : card,
          ),
        })),
      deleteCard: (id) =>
        set((state) => ({
          cards: state.cards.filter((card) => card.id !== id),
        })),
    }),
    {
      name: KANBAN_STORAGE_KEY,
      storage: createJSONStorage(() => safeLocalStorage),
    },
  ),
);
