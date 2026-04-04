import { useCallback, useMemo, useState } from "react";

import { getToolAccessMode } from "@/src/components/integrations/function-access-controls";
import type { BuiltInConnectorOption, ToolAccessMode } from "@/src/types/context-layer";
import {
  connectorOptionLabel,
  filterReviewedTools,
  findConnectorByQuery,
  getReviewedTools,
  hasBuiltInCredentialInput,
  INITIAL_DRAFT,
  type DiscoverFeedback,
  type DiscoveryResponse,
  type WizardDraft,
  type WizardStep,
} from "@/src/components/integrations/wizard/utils";

interface SearchParamsLike {
  get(name: string): string | null;
}

interface UseIntegrationWizardStateOptions {
  builtInConnectors: BuiltInConnectorOption[];
  onStatus: (message: string | null) => void;
  searchParams: SearchParamsLike;
}

export const useWizardState = ({
  builtInConnectors,
  onStatus,
  searchParams,
}: UseIntegrationWizardStateOptions) => {
  const initialBuiltInSlug = searchParams.get("builtIn")?.trim() ?? "";
  const [step, setStep] = useState<WizardStep>(initialBuiltInSlug ? 2 : 1);
  const [draft, setDraft] = useState<WizardDraft>(() =>
    initialBuiltInSlug
      ? {
          ...INITIAL_DRAFT,
          kind: "built_in",
          builtInSlug: initialBuiltInSlug,
          key: initialBuiltInSlug,
          name: initialBuiltInSlug,
        }
      : INITIAL_DRAFT,
  );
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [toolModes, setToolModes] = useState<Record<string, ToolAccessMode>>({});
  const [selectedTools, setSelectedTools] = useState<Record<string, boolean>>({});
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [connectorSearch, setConnectorSearch] = useState(initialBuiltInSlug);
  const [toolSearch, setToolSearch] = useState("");
  const [discoverFeedback, setDiscoverFeedback] =
    useState<DiscoverFeedback | null>(null);

  const selectedConnector = useMemo(
    () =>
      builtInConnectors.find((connector) => connector.slug === draft.builtInSlug) ??
      null,
    [builtInConnectors, draft.builtInSlug],
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

  const builtInAuthStrategy = selectedConnector?.authStrategy ?? null;
  const requiresOAuthConnection = builtInAuthStrategy === "oauth2";
  const oauthConnectionEnabled =
    !requiresOAuthConnection || selectedConnector?.oauthConfigured !== false;

  const handleConnectorSelect = useCallback(
    (connector: BuiltInConnectorOption) => {
      setDraft((current) => ({
        ...current,
        builtInSlug: connector.slug,
        key: connector.slug,
        name: connector.name,
        accessToken:
          current.builtInSlug === connector.slug && connector.authStrategy === "bearer"
            ? current.accessToken
            : "",
        apiKey:
          current.builtInSlug === connector.slug && connector.authStrategy === "api_key"
            ? current.apiKey
            : "",
        headerName:
          connector.apiKeyHeaderName?.trim() ||
          (current.builtInSlug === connector.slug && connector.authStrategy === "api_key"
            ? current.headerName
            : INITIAL_DRAFT.headerName),
        username:
          current.builtInSlug === connector.slug && connector.authStrategy === "basic"
            ? current.username
            : "",
        password:
          current.builtInSlug === connector.slug && connector.authStrategy === "basic"
            ? current.password
            : "",
      }));
      setConnectorSearch(connectorOptionLabel(connector));
      setDiscoverFeedback(null);
      onStatus(null);
    },
    [onStatus],
  );

  const handleConnectorSearchChange = (value: string) => {
    setConnectorSearch(value);

    const connector = findConnectorByQuery(builtInConnectors, value);
    if (connector) {
      handleConnectorSelect(connector);
      return;
    }

    setDraft((current) => ({
      ...current,
      builtInSlug: "",
      accessToken: "",
      apiKey: "",
      headerName: INITIAL_DRAFT.headerName,
      username: "",
      password: "",
    }));
    setDiscoverFeedback(null);
    onStatus(null);
  };

  const selectKind = (kind: WizardDraft["kind"]) => {
    setDraft({ ...INITIAL_DRAFT, kind });
    setDiscovery(null);
    setToolModes({});
    setSelectedTools({});
    setExpandedTools({});
    setConnectorSearch("");
    setToolSearch("");
    setDiscoverFeedback(null);
    setStep(2);
    onStatus(null);
  };

  const applyDiscoveryResult = (result: DiscoveryResponse) => {
    setDiscovery(result);
    setToolModes(
      Object.fromEntries(
        Object.entries(result.functions).map(([name, toolSpec]) => [
          name,
          getToolAccessMode(toolSpec),
        ]),
      ),
    );
    setSelectedTools({});
    setExpandedTools({});
    setToolSearch("");
    setStep(3);
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
    setStep(1);
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
    step,
    applyDiscoveryResult,
    handleConnectorSearchChange,
    handleConnectorSelect,
    resetAfterCreate,
    selectKind,
    setAccessModeForTools,
    setConnectorSearch,
    setDiscoverFeedback,
    setDraft,
    setToolModes,
    setToolSearch,
    setSelectedTools,
    setSelectedStateForTools,
    setStep,
    toggleToolExpanded,
  };
};
