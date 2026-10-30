import { useQuery } from "@tanstack/react-query";
import { parseKnownApps } from "#/utils/canvas-app-catalog";

/** The public App Store catalog shipped with Canvas (`public/known-apps.json`). */
export function useKnownApps(enabled = true) {
  return useQuery({
    queryKey: ["known-apps"],
    queryFn: async () => {
      const response = await fetch("/known-apps.json");
      if (!response.ok) throw new Error(`known-apps.json: ${response.status}`);
      return parseKnownApps(await response.json());
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
    meta: { disableToast: true },
  });
}
