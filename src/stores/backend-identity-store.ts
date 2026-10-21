import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * How an account or backend is drawn in the sidebar tile. `emoji` holds the
 * glyph itself, `icon` names an entry in the curated icon library, and `image`
 * holds a downscaled data URL from an upload.
 */
export type BackendIdentity =
  | { type: "emoji"; value: string }
  | { type: "icon"; name: string }
  | { type: "image"; dataUrl: string };

const VALUE_SEPARATOR = "::";

/** Stable key for one account: a backend, or one of its cloud orgs. */
export function getBackendIdentityKey(
  backendId: string,
  orgId: string | null | undefined,
): string {
  return orgId ? `${backendId}${VALUE_SEPARATOR}${orgId}` : backendId;
}

interface BackendIdentityState {
  identityByKey: Record<string, BackendIdentity>;
  setBackendIdentity: (key: string, identity: BackendIdentity | null) => void;
  /** CSS color behind an account's icon; absent means the default tile fill. */
  backgroundByKey: Record<string, string>;
  setBackgroundColor: (key: string, color: string | null) => void;
}

/**
 * The single owner of per-account icons. Writers are the sidebar picker and
 * the settings picker; both go through `setBackendIdentity`, and `null`
 * clears the entry so the account falls back to the default tile.
 */
export const useBackendIdentityStore = create<BackendIdentityState>()(
  persist(
    (set) => ({
      identityByKey: {},
      setBackendIdentity: (key, identity) =>
        set((state) => {
          const next = { ...state.identityByKey };
          if (identity) next[key] = identity;
          else delete next[key];
          return { identityByKey: next };
        }),
      backgroundByKey: {},
      setBackgroundColor: (key, color) =>
        set((state) => {
          const next = { ...state.backgroundByKey };
          if (color) next[key] = color;
          else delete next[key];
          return { backgroundByKey: next };
        }),
    }),
    {
      name: "backend-identities",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        identityByKey: state.identityByKey,
        backgroundByKey: state.backgroundByKey,
      }),
    },
  ),
);
