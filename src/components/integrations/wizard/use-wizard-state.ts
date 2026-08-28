import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buildSuggestedIntegrationKey } from "@/src/components/dashboard/utils";
import { getToolAccessMode } from "@/src/components/integrations/tool-access-controls";
import type { ManagedConnectorOption, ToolAccessMode } from "@/src/types/integrations-hub";
import {
  connectorOptionLabel,
  filterReviewedTools,
  findConnectorByQuery,
  getReviewedTools,
  INITIAL_DRAFT,
  type DiscoverFeedback,
  type DiscoveryResponse,
  type WizardDraft,
} from "@/src/components/integrations/wizard/utils";

interface SearchParamsLike {
  get(name: string): string | null;
}

const EMPTY_INTEGRATION_KEYS = new Set<string>();

const nextAutoDisplayName = ({
  connectorName,
  integrationKey,
  managedConnectorSlug,
}: {
  connectorName: string;
  integrationKey: string;
  managedConnectorSlug: string;
}) =>
  integrationKey === managedConnectorSlug
    ? connectorName
    : `${connectorName} (${integrationKey})`;

interface UseIntegrationWizardStateOptions {
  existingIntegrationKeys?: Set<string>;
  managedConnectors: ManagedConnectorOption[];
  onStatus: (message: string | null) => void;
  searchParams: SearchParamsLike;
}

export const useWizardState = ({
  existingIntegrationKeys = EMPTY_INTEGRATION_KEYS,
  managedConnectors,
  onStatus,
  searchParams,
}: UseIntegrationWizardStateOptions) => {
  const initialManagedConnectorSlug = searchParams.get("managedConnector")?.trim() || "";
  const initialIntegrationKey = searchParams.get("integrationKey")?.trim() || "";
  const initialSuggestedIntegrationKey = initialManagedConnectorSlug
    ? initialIntegrationKey ||
      buildSuggestedIntegrationKey(initialManagedConnectorSlug, existingIntegrationKeys)
    : "";
  const autoSuggestedIntegrationKey = useRef(
    initialIntegrationKey ? "" : initialSuggestedIntegrationKey,
  );
  const [draft, setDraft] = useState<WizardDraft>(() => {
    if (!initialManagedConnectorSlug) {
      return { ...INITIAL_DRAFT, kind: "managed" };
    }

    return {
      ...INITIAL_DRAFT,
      kind: "managed",
      managedConnectorSlug: initialManagedConnectorSlug,
      key: initialSuggestedIntegrationKey,
      name: initialManagedConnectorSlug,
    };
  });
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [toolModes, setToolModes] = useState<Record<string, ToolAccessMode>>({});
  const [selectedTools, setSelectedTools] = useState<Record<string, boolean>>({});
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [connectorSearch, setConnectorSearch] = useState(initialManagedConnectorSlug);
  const [toolSearch, setToolSearch] = useState("");
  const [discoverFeedback, setDiscoverFeedback] =
    useState<DiscoverFeedback | null>(null);
  const initialRouteSelection = `${initialManagedConnectorSlug}:${initialIntegrationKey}`;
  const lastSyncedRouteSelection = useRef(initialRouteSelection);

  const selectedConnector = useMemo(
    () =>
      managedConnectors.find((connector) => connector.slug === draft.managedConnectorSlug) ??
      null,
    [managedConnectors, draft.managedConnectorSlug],
  );

  const reviewedTools = useMemo(
    () => getReviewedTools(discovery),
    [discovery],
  );

  const filteredReviewedTools = useMemo(
    () => filterReviewedTools({ toolSearch, reviewedTools }),
    [toolSearch, reviewedTools],
  );

  const matchingToolNames = useMemo(
    () => filteredReviewedTools.map(([name]) => name),
    [filteredReviewedTools],
  );

  const selectedToolNames = useMemo(
    () => reviewedTools.map(([name]) => name).filter((name) => selectedTools[name]),
    [reviewedTools, selectedTools],
  );

  const selectedToolCount = selectedToolNames.length;
  const selectedMatchingCount = matchingToolNames.filter(
    (name) => selectedTools[name],
  ).length;
  const allMatchingSelected =
    matchingToolNames.length > 0 &&
    matchingToolNames.every((name) => selectedTools[name]);
  const hasMatchingTools = matchingToolNames.length > 0;

  const managedConnectorAuthStrategy = selectedConnector?.authStrategy ?? null;
  const requiresOAuthConnection = managedConnectorAuthStrategy === "oauth2";
  const oauthConnectionEnabled =
    !requiresOAuthConnection || selectedConnector?.oauthConfigured !== false;

  const handleConnectorSelect = useCallback(
    (connector: ManagedConnectorOption, preferredIntegrationKey?: string) => {
      const explicitIntegrationKey = preferredIntegrationKey?.trim() || "";
      const nextIntegrationKey =
        explicitIntegrationKey ||
        buildSuggestedIntegrationKey(connector.slug, existingIntegrationKeys);

      autoSuggestedIntegrationKey.current = explicitIntegrationKey
        ? ""
        : nextIntegrationKey;

      setDraft((current) => ({
        ...current,
        kind: "managed",
        managedConnectorSlug: connector.slug,
        key: nextIntegrationKey,
        name:
          nextIntegrationKey === connector.slug
            ? connector.name
            : `${connector.name} (${nextIntegrationKey})`,
        accessToken:
          current.managedConnectorSlug === connector.slug && connector.authStrategy === "bearer"
            ? current.accessToken
            : "",
        apiKey:
          current.managedConnectorSlug === connector.slug && connector.authStrategy === "api_key"
            ? current.apiKey
            : "",
        headerName:
          connector.apiKeyHeaderName?.trim() ||
          (current.managedConnectorSlug === connector.slug && connector.authStrategy === "api_key"
            ? current.headerName
            : INITIAL_DRAFT.headerName),
        username:
          current.managedConnectorSlug === connector.slug && connector.authStrategy === "basic"
            ? current.username
            : "",
        password:
          current.managedConnectorSlug === connector.slug && connector.authStrategy === "basic"
            ? current.password
            : "",
        resourceId: "",
      }));
      setConnectorSearch(connectorOptionLabel(connector));
      setDiscoverFeedback(null);
      onStatus(null);
    },
    [existingIntegrationKeys, onStatus],
  );

  const handleConnectorSearchChange = (value: string) => {
    setConnectorSearch(value);

    const connector = findConnectorByQuery(managedConnectors, value);
    if (connector) {
      handleConnectorSelect(connector);
      return;
    }

    setDraft((current) => ({
      ...current,
      managedConnectorSlug: "",
      accessToken: "",
      apiKey: "",
      headerName: INITIAL_DRAFT.headerName,
      username: "",
      password: "",
    }));
    setDiscoverFeedback(null);
    onStatus(null);
  };

  useEffect(() => {
    if (!initialManagedConnectorSlug) {
      lastSyncedRouteSelection.current = "";
      autoSuggestedIntegrationKey.current = "";
      return;
    }

    if (lastSyncedRouteSelection.current === initialRouteSelection) {
      return;
    }

    const connector =
      managedConnectors.find((candidate) => candidate.slug === initialManagedConnectorSlug) ??
      null;

    if (connector) {
      handleConnectorSelect(connector, initialIntegrationKey || undefined);
    } else {
      const nextIntegrationKey =
        initialIntegrationKey ||
        buildSuggestedIntegrationKey(initialManagedConnectorSlug, existingIntegrationKeys);
      autoSuggestedIntegrationKey.current = initialIntegrationKey
        ? ""
        : nextIntegrationKey;
      setDraft({
        ...INITIAL_DRAFT,
        kind: "managed",
        managedConnectorSlug: initialManagedConnectorSlug,
        key: nextIntegrationKey,
        name: initialManagedConnectorSlug,
      });
      setConnectorSearch(initialManagedConnectorSlug);
      setDiscoverFeedback(null);
      onStatus(null);
    }

    setDiscovery(null);
    setToolModes({});
    setSelectedTools({});
    setExpandedTools({});
    setToolSearch("");
    lastSyncedRouteSelection.current = initialRouteSelection;
  }, [
    existingIntegrationKeys,
    handleConnectorSelect,
    initialIntegrationKey,
    initialManagedConnectorSlug,
    initialRouteSelection,
    managedConnectors,
    onStatus,
  ]);

  useEffect(() => {
    if (!initialManagedConnectorSlug || initialIntegrationKey) {
      return;
    }

    const nextIntegrationKey = buildSuggestedIntegrationKey(
      initialManagedConnectorSlug,
      existingIntegrationKeys,
    );
    const previousAutoIntegrationKey = autoSuggestedIntegrationKey.current;

    if (!previousAutoIntegrationKey || previousAutoIntegrationKey === nextIntegrationKey) {
      return;
    }

    setDraft((current) => {
      if (
        current.kind !== "managed" ||
        current.managedConnectorSlug !== initialManagedConnectorSlug ||
        current.key.trim() !== previousAutoIntegrationKey
      ) {
        return current;
      }

      autoSuggestedIntegrationKey.current = nextIntegrationKey;
      const connectorName = selectedConnector?.name.trim() || initialManagedConnectorSlug;
      const currentName = current.name.trim();
      const previousAutoNames = new Set([
        initialManagedConnectorSlug,
        connectorName,
        nextAutoDisplayName({
          connectorName,
          integrationKey: previousAutoIntegrationKey,
          managedConnectorSlug: initialManagedConnectorSlug,
        }),
        nextAutoDisplayName({
          connectorName: initialManagedConnectorSlug,
          integrationKey: previousAutoIntegrationKey,
          managedConnectorSlug: initialManagedConnectorSlug,
        }),
      ]);
      const shouldUpdateName =
        !currentName || previousAutoNames.has(currentName);

      return {
        ...current,
        key: nextIntegrationKey,
        name: shouldUpdateName
          ? nextAutoDisplayName({
              connectorName,
              integrationKey: nextIntegrationKey,
              managedConnectorSlug: initialManagedConnectorSlug,
            })
          : current.name,
      };
    });
  }, [
    existingIntegrationKeys,
    initialIntegrationKey,
    initialManagedConnectorSlug,
    selectedConnector?.name,
  ]);

  const selectKind = (kind: WizardDraft["kind"]) => {
    const connector =
      kind === "managed" && initialManagedConnectorSlug
        ? managedConnectors.find(
            (candidate) => candidate.slug === initialManagedConnectorSlug,
          ) ?? null
        : null;

    if (connector) {
      handleConnectorSelect(connector, initialIntegrationKey || undefined);
    } else {
      setDraft({ ...INITIAL_DRAFT, kind });
      setConnectorSearch("");
    }
    setDiscovery(null);
    setToolModes({});
    setSelectedTools({});
    setExpandedTools({});
    setToolSearch("");
    setDiscoverFeedback(null);
    onStatus(null);
  };

  const applyDiscoveryResult = (result: DiscoveryResponse) => {
    setDiscovery(result);
    setToolModes(
      Object.fromEntries(
        Object.entries(result.tools).map(([name, toolSpec]) => [
          name,
          getToolAccessMode(toolSpec),
        ]),
      ),
    );
    setSelectedTools({});
    setExpandedTools({});
    setToolSearch("");
  };

  const resetToConnectStep = () => {
    setDiscoverFeedback(null);
    setDiscovery(null);
    setToolModes({});
    setSelectedTools({});
    setExpandedTools({});
    setToolSearch("");
  };

  const resetAfterCreate = () => {
    setDraft(INITIAL_DRAFT);
    setDiscovery(null);
    setToolModes({});
    setSelectedTools({});
    setExpandedTools({});
    setConnectorSearch("");
    setToolSearch("");
    setDiscoverFeedback(null);
  };

  const setAccessModeForTools = (
    names: string[],
    accessMode: ToolAccessMode,
  ) => {
    if (names.length === 0) {
      return;
    }

    setToolModes((current) => ({
      ...current,
      ...Object.fromEntries(names.map((name) => [name, accessMode])),
    }));
    setSelectedTools({});
  };

  const setSelectedStateForTools = (names: string[], selected: boolean) => {
    if (names.length === 0) {
      return;
    }

    setSelectedTools((current) => ({
      ...current,
      ...Object.fromEntries(names.map((name) => [name, selected])),
    }));
  };

  const toggleToolExpanded = (name: string) => {
    setExpandedTools((current) => ({
      ...current,
      [name]: !current[name],
    }));
  };

  return {
    allMatchingSelected,
    connectorSearch,
    discoverFeedback,
    discovery,
    draft,
    expandedTools,
    filteredReviewedTools,
    toolModes,
    toolSearch,
    hasMatchingTools,
    matchingToolNames,
    oauthConnectionEnabled,
    requiresOAuthConnection,
    reviewedTools,
    selectedConnector,
    selectedToolCount,
    selectedToolNames,
    selectedTools,
    selectedMatchingCount,
    applyDiscoveryResult,
    handleConnectorSearchChange,
    handleConnectorSelect,
    resetAfterCreate,
    resetToConnectStep,
    selectKind,
    setAccessModeForTools,
    setDiscoverFeedback,
    setDraft,
    setToolModes,
    setToolSearch,
    setSelectedTools,
    setSelectedStateForTools,
    toggleToolExpanded,
  };
};
