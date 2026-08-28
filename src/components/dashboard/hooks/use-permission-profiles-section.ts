"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { fetchJson } from "@/src/lib/fetch-json";
import type {
  PermissionProfile,
  PermissionProfileApplyResult,
} from "@/src/types/integrations-hub";

const permissionProfileLabel = (profile: PermissionProfile) =>
  profile.name ?? "Default profile";

interface UsePermissionProfilesSectionOptions {
  enabled: boolean;
  onStatus: (message: string | null) => void;
}

export const usePermissionProfilesSection = ({
  enabled,
  onStatus,
}: UsePermissionProfilesSectionOptions) => {
  const queryClient = useQueryClient();
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  const permissionProfilesQuery = useQuery({
    queryKey: ["permission-profiles"],
    queryFn: () => fetchJson<PermissionProfile[]>("/api/permission-profiles"),
    enabled,
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["integrations"] }),
      queryClient.invalidateQueries({ queryKey: ["access-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["permission-profiles"] }),
    ]);
  };

  const permissionProfileMutation = useMutation({
    mutationFn: async ({
      url,
      method = "POST",
      body,
    }: {
      url: string;
      method?: string;
      body?: unknown;
    }) =>
      fetchJson<
        PermissionProfile | PermissionProfileApplyResult | { deleted: boolean }
      >(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }),
    onSuccess: async (result, variables) => {
      if ("deleted" in result) {
        onStatus("Deleted permission profile.");
        await invalidateAll();
        return;
      }

      const profile = "profile" in result ? result.profile : result;
      if (variables.url.endsWith("/load")) {
        const applied = "appliedTools" in result ? result.appliedTools : 0;
        onStatus(`Loaded ${permissionProfileLabel(profile)} and applied ${applied} tool settings.`);
      } else if (variables.url.endsWith("/update")) {
        onStatus(`Updated ${permissionProfileLabel(profile)} from current settings.`);
      } else {
        setIsSaveModalOpen(false);
        const requestedName =
          variables.body &&
          typeof variables.body === "object" &&
          variables.body !== null &&
          "name" in variables.body
            ? String((variables.body as { name: unknown }).name).trim()
            : "";
        onStatus(
          `Saved ${requestedName || permissionProfileLabel(profile)} permission profile.`,
        );
      }
      await invalidateAll();
    },
    onError: (error: Error) => {
      onStatus(error.message);
    },
  });

  const handleSavePermissionProfile = (profileName: string) => {
    permissionProfileMutation.mutate({
      url: "/api/permission-profiles",
      body: { name: profileName.trim() },
    });
  };

  const handleLoadPermissionProfile = (profile: PermissionProfile) => {
    if (
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      !window.confirm(
        `Load "${permissionProfileLabel(profile)}" and replace matching current integration and tool permission settings?`,
      )
    ) {
      return;
    }

    permissionProfileMutation.mutate({
      url: `/api/permission-profiles/${profile.id}/load`,
    });
  };

  const handleUpdatePermissionProfile = (profile: PermissionProfile) => {
    if (
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      !window.confirm(
        `Overwrite "${permissionProfileLabel(profile)}" with the current integration and tool permission settings?`,
      )
    ) {
      return;
    }

    permissionProfileMutation.mutate({
      url: `/api/permission-profiles/${profile.id}/update`,
    });
  };

  const handleDeletePermissionProfile = (profile: PermissionProfile) => {
    permissionProfileMutation.mutate({
      url: `/api/permission-profiles/${profile.id}`,
      method: "DELETE",
    });
  };

  return {
    actionPending: permissionProfileMutation.isPending,
    errorMessage: permissionProfilesQuery.isError
      ? (permissionProfilesQuery.error as Error).message
      : null,
    isPending: permissionProfilesQuery.isPending,
    isSaveModalOpen,
    onCloseSaveModal: () => setIsSaveModalOpen(false),
    onOpenSaveModal: () => setIsSaveModalOpen(true),
    onSaveProfile: handleSavePermissionProfile,
    onLoadProfile: handleLoadPermissionProfile,
    onUpdateProfile: handleUpdatePermissionProfile,
    onDeleteProfile: handleDeletePermissionProfile,
    profiles: permissionProfilesQuery.data ?? [],
  };
};
