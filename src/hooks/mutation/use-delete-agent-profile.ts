import { useMutation, useQueryClient } from "@tanstack/react-query";
import AgentProfilesService from "#/api/agent-profiles-service/agent-profiles-service.api";
import { AGENT_PROFILES_QUERY_KEYS } from "#/hooks/query/query-keys";
import { forgetAgentProfileLocalState } from "#/utils/agent-profile-local-state";

export function useDeleteAgentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => AgentProfilesService.deleteProfile(name),
    onSuccess: async (_data, name) => {
      const profileId = queryClient
        .getQueriesData<{
          profiles?: Array<{ id?: string | null; name: string }>;
        }>({ queryKey: AGENT_PROFILES_QUERY_KEYS.all })
        .flatMap(([, list]) => list?.profiles ?? [])
        .find((profile) => profile.name === name)?.id;
      forgetAgentProfileLocalState(name, profileId);
      await queryClient.invalidateQueries({
        queryKey: AGENT_PROFILES_QUERY_KEYS.all,
      });
    },
    // Consumers handle errors with try-catch and manual toasts.
    meta: { disableToast: true },
  });
}
