import { useQuery } from "@tanstack/react-query";
import { getCloudOrganizationMembers } from "#/api/cloud/organization-service.api";
import { useActiveBackend } from "#/contexts/active-backend-context";

/**
 * Fetch all members of the active cloud organization. Disabled on local
 * backends (no org concept) and until the org id is known. Used by the
 * Team page to display teammates and their roles.
 */
export function useCloudOrgMembers() {
  const { backend, orgId } = useActiveBackend();
  const enabled = backend.kind === "cloud" && !!orgId;

  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return useQuery({
    queryKey: [
      "cloud-org-members",
      backend.id,
      orgId,
      backend.connectionRevision ?? 0,
    ],
    queryFn: () => getCloudOrganizationMembers(orgId!, backend),
    enabled,
    staleTime: 1000 * 60 * 5,
    retry: false,
    meta: { disableToast: true },
  });
}
