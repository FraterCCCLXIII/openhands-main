import { create } from "zustand";

interface WebviewState {
  /** The URL to display in the live webview iframe. */
  url: string;
}

interface WebviewStore extends WebviewState {
  setUrl: (url: string) => void;
  reset: () => void;
}

const initialState: WebviewState = {
  url: "",
};

export const useWebviewStore = create<WebviewStore>((set) => ({
  ...initialState,
  setUrl: (url: string) => set({ url }),
  reset: () => set(initialState),
}));
