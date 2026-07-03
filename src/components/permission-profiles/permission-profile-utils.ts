import type { PermissionProfile } from "@/src/types/integrations-hub";

export const permissionProfileLabel = (profile: PermissionProfile) =>
  profile.name ?? "Default profile";

export const isDefaultPermissionProfile = (profile: PermissionProfile) =>
  profile.name === null;

export const permissionProfileCounts = (profile: PermissionProfile) => {
  const integrations = Object.values(profile.snapshot.integrations);
  return integrations.reduce(
    (counts, integration) => {
      counts.integrations += 1;
      if (integration.enabled) {
        counts.enabledIntegrations += 1;
      }
      for (const mode of Object.values(integration.tools)) {
        counts.tools += 1;
        if (!integration.enabled) {
          counts.disabled += 1;
          continue;
        }
        counts[mode] += 1;
      }
      return counts;
    },
    {
      integrations: 0,
      enabledIntegrations: 0,
      tools: 0,
      enabled: 0,
      approval_required: 0,
      disabled: 0,
    },
  );
};

export const formatPermissionProfileSummary = (profile: PermissionProfile) => {
  const counts = permissionProfileCounts(profile);
  return `${counts.enabledIntegrations}/${counts.integrations} integrations on · ${counts.enabled} enabled · ${counts.approval_required} case-by-case · ${counts.disabled} disabled`;
};

export const formatPermissionProfileUpdatedAt = (profile: PermissionProfile) =>
  new Date(profile.updatedAt).toLocaleString();
