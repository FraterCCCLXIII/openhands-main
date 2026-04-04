import { useCallback, useMemo, useState } from "react";

import { getFunctionAccessMode } from "@/src/components/integrations/function-access-controls";
import type { BuiltInConnectorOption, FunctionAccessMode } from "@/src/types/context-layer";
import {
  connectorOptionLabel,
  filterReviewedFunctions,
  findConnectorByQuery,
  getReviewedFunctions,
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
  const [functionModes, setFunctionModes] = useState<Record<string, FunctionAccessMode>>({});
  const [selectedFunctions, setSelectedFunctions] = useState<Record<string, boolean>>({});
  const [expandedFunctions, setExpandedFunctions] = useState<Record<string, boolean>>({});
  const [connectorSearch, setConnectorSearch] = useState(initialBuiltInSlug);
  const [functionSearch, setFunctionSearch] = useState("");
  const [discoverFeedback, setDiscoverFeedback] =
    useState<DiscoverFeedback | null>(null);

  const selectedConnector = useMemo(
    () =>
      builtInConnectors.find((connector) => connector.slug === draft.builtInSlug) ??
      null,
    [builtInConnectors, draft.builtInSlug],
  );

  const reviewedFunctions = useMemo(
    () => getReviewedFunctions(discovery),
    [discovery],
  );

  const filteredReviewedFunctions = useMemo(
    () => filterReviewedFunctions({ functionSearch, reviewedFunctions }),
    [functionSearch, reviewedFunctions],
  );

  const matchingFunctionNames = useMemo(
    () => filteredReviewedFunctions.map(([name]) => name),
    [filteredReviewedFunctions],
  );

  const selectedFunctionNames = useMemo(
    () => reviewedFunctions.map(([name]) => name).filter((name) => selectedFunctions[name]),
    [reviewedFunctions, selectedFunctions],
  );

  const selectedFunctionCount = selectedFunctionNames.length;
  const selectedMatchingCount = matchingFunctionNames.filter(
    (name) => selectedFunctions[name],
  ).length;
  const allMatchingSelected =
    matchingFunctionNames.length > 0 &&
    matchingFunctionNames.every((name) => selectedFunctions[name]);
  const hasMatchingFunctions = matchingFunctionNames.length > 0;

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
    setFunctionModes({});
    setSelectedFunctions({});
    setExpandedFunctions({});
    setConnectorSearch("");
    setFunctionSearch("");
    setDiscoverFeedback(null);
    setStep(2);
    onStatus(null);
  };

  const applyDiscoveryResult = (result: DiscoveryResponse) => {
    setDiscovery(result);
    setFunctionModes(
      Object.fromEntries(
        Object.entries(result.functions).map(([name, functionSpec]) => [
          name,
          getFunctionAccessMode(functionSpec),
        ]),
      ),
    );
    setSelectedFunctions({});
    setExpandedFunctions({});
    setFunctionSearch("");
    setStep(3);
  };

  const resetAfterCreate = () => {
    setDraft(INITIAL_DRAFT);
    setDiscovery(null);
    setFunctionModes({});
    setSelectedFunctions({});
    setExpandedFunctions({});
    setConnectorSearch("");
    setFunctionSearch("");
    setDiscoverFeedback(null);
    setStep(1);
  };

  const setAccessModeForFunctions = (
    names: string[],
    accessMode: FunctionAccessMode,
  ) => {
    if (names.length === 0) {
      return;
    }

    setFunctionModes((current) => ({
      ...current,
      ...Object.fromEntries(names.map((name) => [name, accessMode])),
    }));
    setSelectedFunctions({});
  };

  const setSelectedStateForFunctions = (names: string[], selected: boolean) => {
    if (names.length === 0) {
      return;
    }

    setSelectedFunctions((current) => ({
      ...current,
      ...Object.fromEntries(names.map((name) => [name, selected])),
    }));
  };

  const toggleFunctionExpanded = (name: string) => {
    setExpandedFunctions((current) => ({
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
    expandedFunctions,
    filteredReviewedFunctions,
    functionModes,
    functionSearch,
    hasMatchingFunctions,
    matchingFunctionNames,
    oauthConnectionEnabled,
    requiresOAuthConnection,
    reviewedFunctions,
    selectedConnector,
    selectedFunctionCount,
    selectedFunctionNames,
    selectedFunctions,
    selectedMatchingCount,
    step,
    applyDiscoveryResult,
    handleConnectorSearchChange,
    handleConnectorSelect,
    resetAfterCreate,
    selectKind,
    setAccessModeForFunctions,
    setConnectorSearch,
    setDiscoverFeedback,
    setDraft,
    setFunctionModes,
    setFunctionSearch,
    setSelectedFunctions,
    setSelectedStateForFunctions,
    setStep,
    toggleFunctionExpanded,
  };
};
