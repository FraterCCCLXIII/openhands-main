import { create } from "zustand";

type RequestFilter = "all" | "pending" | "approved" | "rejected";

type AdminStore = {
  providerFilter: string;
  requestFilter: RequestFilter;
  setProviderFilter: (providerFilter: string) => void;
  setRequestFilter: (requestFilter: RequestFilter) => void;
};

export const useAdminStore = create<AdminStore>((set) => ({
  providerFilter: "all",
  requestFilter: "all",
  setProviderFilter: (providerFilter) => set({ providerFilter }),
  setRequestFilter: (requestFilter) => set({ requestFilter }),
}));
