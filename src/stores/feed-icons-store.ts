import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { IconAppearanceValue } from "#/ui/icon-appearance-picker";

interface FeedIconsState {
  /**
   * Custom icon appearance by key. Build keys with the helpers in
   * `#/utils/feed-icon-keys`; project names are stored as they are.
   */
  icons: Record<string, IconAppearanceValue>;
}

interface FeedIconsActions {
  /** Saves an icon; an empty value removes it. */
  setIcon: (key: string, value: IconAppearanceValue) => void;
}

const LEGACY_PROJECT_ICONS_KEY = "feed-project-icons";

/** Project icons saved before this store covered every kind of icon. */
function readLegacyProjectIcons(): Record<string, IconAppearanceValue> {
  try {
    const raw = localStorage.getItem(LEGACY_PROJECT_ICONS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.state?.iconsByProject ?? {};
  } catch {
    return {};
  }
}

/**
 * Owns the custom icons people pick in the feed: projects, factories, people
 * and agents. The writer is `setIcon`; every icon view reads from here.
 */
export const useFeedIconsStore = create<FeedIconsState & FeedIconsActions>()(
  persist(
    (set) => ({
      icons: readLegacyProjectIcons(),
      setIcon: (key, value) =>
        set((state) => {
          const { [key]: _removed, ...rest } = state.icons;
          const isEmpty =
            !value.background && !value.emoji && !value.lucide_icon;
          return { icons: isEmpty ? rest : { ...rest, [key]: value } };
        }),
    }),
    {
      name: "feed-icons",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
