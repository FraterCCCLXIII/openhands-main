"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { fetchJson } from "@/src/lib/fetch-json";
import {
  buildConnectorMap,
  buildInstalledIntegrationKeys,
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
  IntegrationSpec,
  ManagedConnectorOption,
  ToolAccessMode,
  UnusedToolWindowUnit,
} from "@/src/types/integrations-hub";

interface UseIntegrationsSectionOptions {
  initialIntegrations: IntegrationSpec[];
  enabled: boolean;
  onStatus: (message: string | null) => void;
}

export const useIntegrationsSection = ({
  initialIntegrations,
  enabled,
  onStatus,
}: UseIntegrationsSectionOptions) => {
  const queryClient = useQueryClient();
  const [addIntegrationSearch, setAddIntegrationSearch] = useState("");
  const [integrationSearch, setIntegrationSearch] = useState("");
  const [hideDisabledTools, setHideDisabledTools] = useState(true);
  const [unusedThresholdValue, setUnusedThresholdValue] = useState("30");
  const [unusedThresholdUnit, setUnusedThresholdUnit] =
    useState<UnusedToolWindowUnit>("days");
  const [expandedIntegrations, setExpandedIntegrations] = useState<
    Record<string, boolean>
  >({});
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});

  const integrationsQuery = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchJson<IntegrationSpec[]>("/api/integrations"),
    initialData: initialIntegrations,
  });

  const managedConnectorsQuery = useQuery({
    queryKey: ["managed-connectors"],
    queryFn: () =>
      fetchJson<ManagedConnectorOption[]>("/api/integrations/managed-connectors"),
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

  const normalizedUnusedThresholdValue = useMemo(() => {
    const parsed = Number(unusedThresholdValue);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return 30;
    }
    return Math.min(Math.max(Math.trunc(parsed), 1), 3650);
  }, [unusedThresholdValue]);

  const installedIntegrationKeys = useMemo(
    () => buildInstalledIntegrationKeys(integrations),
    [integrations],
  );
  const connectorBySlug = useMemo(
    () => buildConnectorMap(managedConnectors),
    [managedConnectors],
  );
  const availableConnectorCount = useMemo(
    () =>
      managedConnectors.filter(
        (connector) => !installedIntegrationKeys.has(connector.slug),
      ).length,
    [managedConnectors, installedIntegrationKeys],
  );
  const marketplaceConnectors = useMemo(
    () =>
      buildMarketplaceConnectors({
        managedConnectors,
        installedIntegrationKeys,
        search: addIntegrationSearch,
      }),
    [addIntegrationSearch, managedConnectors, installedIntegrationKeys],
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
  const unusedCutoffDate = useMemo(
    () =>
      subtractUnusedWindow(
        new Date(),
        normalizedUnusedThresholdValue,
        unusedThresholdUnit,
      ),
    [normalizedUnusedThresholdValue, unusedThresholdUnit],
  );
  const unusedToolCandidates = useMemo(
    () =>
      buildUnusedToolCandidates({
        integrations,
        cutoffDate: unusedCutoffDate,
      }),
    [integrations, unusedCutoffDate],
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

  const handleUnusedThresholdBlur = () => {
    setUnusedThresholdValue(String(normalizedUnusedThresholdValue));
  };

  const handleDisableUnusedTools = () => {
    if (unusedToolCandidates.length === 0) {
      onStatus("No tracked tools matched the selected unused window.");
      return;
    }

    if (
      typeof window !== "undefined" &&
      typeof window.confirm === "function" &&
      !window.confirm(
        `Disable ${unusedToolCandidates.length} tracked ${unusedToolCandidates.length === 1 ? "tool" : "tools"} that have not been used since ${unusedCutoffDate.toLocaleDateString()}?`,
      )
    ) {
      return;
    }

    bulkDisableMutation.mutate({
      thresholdValue: normalizedUnusedThresholdValue,
      thresholdUnit: unusedThresholdUnit,
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
    onUnusedThresholdBlur: handleUnusedThresholdBlur,
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
    onUnusedThresholdUnitChange: setUnusedThresholdUnit,
    onUnusedThresholdValueChange: setUnusedThresholdValue,
    resolveIntegrationLogoMetadata: (integration: IntegrationSpec) =>
      resolveIntegrationLogoMetadata({
        integration,
        connectorBySlug,
        getConnectorLogoUrl,
      }),
    setAddIntegrationSearch,
    setHideDisabledTools,
    setIntegrationSearch,
    unusedCutoffDateLabel: unusedCutoffDate.toLocaleDateString(),
    unusedToolCandidateCount: unusedToolCandidates.length,
    unusedThresholdUnit,
    unusedThresholdValue,
    visibleToolCount,
  };
};
