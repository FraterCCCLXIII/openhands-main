import { create } from "zustand";

export interface AddBackendPrefill {
  name: string;
  host: string;
}

interface AddBackendPrefillState {
  prefill: AddBackendPrefill | null;
  setPrefill: (prefill: AddBackendPrefill | null) => void;
}

/**
 * A backend picked from the detected list, waiting for the Add Backend dialog
 * to read it. The dialog is mounted from several places, so this carries the
 * choice to whichever one opens, and the dialog clears it when it closes.
 */
export const useAddBackendPrefillStore = create<AddBackendPrefillState>()(
  (set) => ({
    prefill: null,
    setPrefill: (prefill) => set({ prefill }),
  }),
);
