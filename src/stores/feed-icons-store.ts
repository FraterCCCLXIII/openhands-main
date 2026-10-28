import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { IconAppearanceValue } from "#/ui/icon-appearance-picker";

interface FeedProjectIconsState {
  /** Custom icon appearance by project key (see `getFeedProject`). */
  iconsByProject: Record<string, IconAppearanceValue>;
}

interface FeedProjectIconsActions {
  /** Saves a project's icon; an empty value removes it. */
  setIcon: (project: string, value: IconAppearanceValue) => void;
}

/** Owns the custom icons people pick for projects in the feed's left list. */
export const useFeedProjectIconsStore = create<
  FeedProjectIconsState & FeedProjectIconsActions
>()(
  persist(
    (set) => ({
      iconsByProject: {},
      setIcon: (project, value) =>
        set((state) => {
          const { [project]: _removed, ...rest } = state.iconsByProject;
          const isEmpty =
            !value.background && !value.emoji && !value.lucide_icon;
          return {
            iconsByProject: isEmpty ? rest : { ...rest, [project]: value },
          };
        }),
    }),
    {
      name: "feed-project-icons",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
