import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FeedSectionsState {
  /** Sections the user collapsed, by section id; everything else is open. */
  collapsed: Record<string, boolean>;
  toggle: (sectionId: string) => void;
}

/**
 * Owns which sections of Tower's left panel are collapsed. Stored as a
 * deny-list so a section added later starts open.
 */
export const useFeedSectionsStore = create<FeedSectionsState>()(
  persist(
    (set) => ({
      collapsed: {},
      toggle: (sectionId) =>
        set((state) => ({
          collapsed: {
            ...state.collapsed,
            [sectionId]: !state.collapsed[sectionId],
          },
        })),
    }),
    {
      name: "feed-left-sections",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // An unreadable or older save falls back to everything open.
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<FeedSectionsState>;
        return {
          ...current,
          collapsed:
            saved.collapsed && typeof saved.collapsed === "object"
              ? saved.collapsed
              : {},
        };
      },
    },
  ),
);
