"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { fetchJson } from "@/src/lib/fetch-json";
import { catalogOptionsToConnectorOptions } from "@/src/lib/catalog-mappers";
import {
  buildConnectorMap,
  buildMarketplaceConnectors,
  buildToolAccessPatch,
  buildUnusedToolCandidates,
  filterIntegrationsForDisplay,
  resolveIntegrationLogoMetadata,
  subtractUnusedWindow,
} from "@/src/components/dashboard/utils";
import { getConnectorLogoUrl } from "@/src/components/dashboard/shared";
import type {
  DisableUnusedToolsResult,
  IntegrationCatalogOption,
  IntegrationSpec,
  ToolAccessMode,
  UnusedToolWindowUnit,
} from "@/src/types/integrations-hub";

interface UseIntegrationsSectionOptions {
  initialIntegrations?: IntegrationSpec[];
  enabled: boolean;
  onStatus: (message: string | null) => void;
}

export const useIntegrationsSection = ({
  initialIntegrations = [],
  enabled,
  onStatus,
}: UseIntegrationsSectionOptions) => {
  const queryClient = useQueryClient();
  const [addIntegrationSearch, setAddIntegrationSearch] = useState("");
  const [integrationSearch, setIntegrationSearch] = useState("");
  const [hideDisabledTools, setHideDisabledTools] = useState(true);
  const [expandedIntegrations, setExpandedIntegrations] = useState<
    Record<string, boolean>
  >({});
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  const integrationsQuery = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchJson<IntegrationSpec[]>("/api/integrations"),
    initialData: initialIntegrations,
    // Mark the seed as stale so a background refetch fires on mount; matches
    // the workspace-level query and avoids a stale empty seed masking
    // already-installed integrations on first load.
    initialDataUpdatedAt: 0,
    enabled,
    staleTime: 30_000,
  });

  const managedConnectorsQuery = useQuery({
    queryKey: ["managed-connectors"],
    queryFn: async () => {
      const catalog = await fetchJson<IntegrationCatalogOption[]>(
        "/api/integrations?filter=enabled",
      );
      return catalogOptionsToConnectorOptions(catalog);
    },
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const invalidateAll = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["integrations"] }),
      queryClient.invalidateQueries({ queryKey: ["access-requests"] }),
      queryClient.invalidateQueries({ queryKey: ["permission-profiles"] }),
    ]);
  };

  const actionMutation = useMutation({
    mutationFn: async ({
      url,
      method,
      body,
    }: {
      url: string;
      method: string;
      body?: unknown;
      successMessage?: string;
    }) =>
      fetchJson(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      }),
    onSuccess: async (_data, variables) => {
      onStatus(variables.successMessage ?? "Saved.");
      await invalidateAll();
    },
    onError: (error: Error) => {
      onStatus(error.message);
    },
  });

  const bulkDisableMutation = useMutation({
    mutationFn: async (payload: {
      thresholdValue: number;
      thresholdUnit: UnusedToolWindowUnit;
    }) =>
      fetchJson<DisableUnusedToolsResult>("/api/integrations/disable-unused", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async (result) => {
      onStatus(
        result.disabledCount > 0
          ? `Disabled ${result.disabledCount} tracked ${result.disabledCount === 1 ? "tool" : "tools"} unused since ${new Date(result.cutoffIso).toLocaleDateString()}.`
          : "No tracked tools matched the selected unused window.",
      );
      await invalidateAll();
    },
    onError: (error: Error) => {
      onStatus(error.message);
    },
  });

  const integrations = integrationsQuery.data ?? [];
  const managedConnectors = managedConnectorsQuery.data ?? [];

  const connectorBySlug = useMemo(
    () => buildConnectorMap(managedConnectors),
    [managedConnectors],
  );
  const availableConnectorCount = managedConnectors.length;
  const marketplaceConnectors = useMemo(
    () =>
      buildMarketplaceConnectors({
        managedConnectors,
        search: addIntegrationSearch,
      }),
    [addIntegrationSearch, managedConnectors],
  );
  const filteredIntegrations = useMemo(
    () =>
      filterIntegrationsForDisplay({
        integrations,
        integrationSearch,
        hideDisabledTools,
      }),
    [hideDisabledTools, integrationSearch, integrations],
  );
  const visibleToolCount = filteredIntegrations.reduce(
    (count, entry) => count + entry.visibleTools.length,
    0,
  );

  const toggleIntegrationExpanded = (
    integrationKey: string,
    expanded: boolean,
  ) => {
    setExpandedIntegrations((current) => ({
      ...current,
      [integrationKey]: !expanded,
    }));
  };

  const toggleToolExpanded = (toolKey: string) => {
    setExpandedTools((current) => ({
      ...current,
      [toolKey]: !current[toolKey],
    }));
  };

  const updateToolAccessMode = (
    integrationKey: string,
    toolName: string,
    accessMode: ToolAccessMode,
  ) => {
    actionMutation.mutate(
      buildToolAccessPatch(integrationKey, toolName, accessMode),
    );
  };

  const handleDisableUnusedTools = (
    thresholdValue: number,
    thresholdUnit: UnusedToolWindowUnit,
  ) => {
    const cutoff = subtractUnusedWindow(new Date(), thresholdValue, thresholdUnit);
    const candidates = buildUnusedToolCandidates({ integrations, cutoffDate: cutoff });
    if (candidates.length === 0) {
      onStatus("No tracked tools matched the selected unused window.");
      return;
    }

    if (
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      !window.confirm(
        `Disable ${candidates.length} tracked ${candidates.length === 1 ? "tool" : "tools"} that have not been used since ${cutoff.toLocaleDateString()}?`,
      )
    ) {
      return;
    }

    bulkDisableMutation.mutate({
      thresholdValue,
      thresholdUnit,
    });
  };

  const handleDeleteIntegration = (integration: IntegrationSpec) => {
    if (
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      !window.confirm(
        `Delete the integration "${integration.name}"? This removes it from your personal dashboard and disconnects any saved credentials for this tool.`,
      )
    ) {
      return;
    }

    actionMutation.mutate({
      url: `/api/integrations/${integration.key}`,
      method: "DELETE",
      successMessage: `${integration.name} deleted.`,
    });
  };

  const handleToggleIntegrationEnabled = (integration: IntegrationSpec) => {
    actionMutation.mutate({
      url: `/api/integrations/${integration.key}/toggle`,
      method: "POST",
      body: { enabled: !integration.enabled },
    });
  };

  return {
    addIntegrationSearch,
    availableConnectorCount,
    connectorBySlug,
    expandedIntegrations,
    expandedTools,
    filteredIntegrations,
    handleDeleteIntegration,
    handleDisableUnusedTools,
    onToggleIntegrationEnabled: handleToggleIntegrationEnabled,
    hideDisabledTools,
    integrationCount: integrations.length,
    integrationSearch,
    isActionPending: actionMutation.isPending,
    isBulkDisablePending: bulkDisableMutation.isPending,
    managedConnectorsError: managedConnectorsQuery.isError
      ? (managedConnectorsQuery.error as Error).message
      : null,
    managedConnectorsPending: managedConnectorsQuery.isPending,
    marketplaceConnectors,
    onToggleIntegrationExpanded: toggleIntegrationExpanded,
    onToggleToolExpanded: toggleToolExpanded,
    onUpdateToolAccessMode: updateToolAccessMode,
    resolveIntegrationLogoMetadata: (integration: IntegrationSpec) =>
      resolveIntegrationLogoMetadata({
        integration,
        connectorBySlug,
        getConnectorLogoUrl,
      }),
    setAddIntegrationSearch,
    setHideDisabledTools,
    setIntegrationSearch,
    visibleToolCount,
  };
};
