"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { fetchJson, ApiRequestError } from "@/src/lib/fetch-json";
import { IntegrationWizardStepConnect } from "@/src/components/integrations/wizard/connect-step";
import { IntegrationWizardStepKind } from "@/src/components/integrations/wizard/kind-step";
import { IntegrationWizardStepReview } from "@/src/components/integrations/wizard/review-step";
import {
  IntegrationWizardIntro,
  StepBadge,
} from "@/src/components/integrations/wizard/shared";
import { useIntegrationWizardState } from "@/src/components/integrations/wizard/use-wizard-state";
import { Card } from "@/src/components/ui/card";
import { filterReadyBuiltInConnectors } from "@/src/lib/integrations/connector-readiness";
import type {
  BuiltInConnectorOption,
  IntegrationConnectionStatus,
} from "@/src/types/context-layer";
import {
  buildCreatePayload,
  buildDiscoverPayload,
  hasBuiltInCredentialInput,
  type DiscoveryResponse,
} from "@/src/components/integrations/wizard/utils";
import { type AdminSection } from "@/src/lib/admin-routes";

interface IntegrationWizardProps {
  onCreated: () => Promise<void>;
  onStatus: (message: string | null) => void;
  redirectSection?: AdminSection;
}

export const IntegrationWizard = ({
  onCreated,
  onStatus,
  redirectSection = "integrations",
}: IntegrationWizardProps) => {
  const searchParams = useSearchParams();

  const builtInConnectorsQuery = useQuery({
    queryKey: ["built-in-connectors"],
    queryFn: () =>
      fetchJson<BuiltInConnectorOption[]>("/api/integrations/built-in-connectors"),
    enabled: true,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const builtInConnectors = useMemo(
    () => filterReadyBuiltInConnectors(builtInConnectorsQuery.data ?? []),
    [builtInConnectorsQuery.data],
  );

  const connectionStatusesQuery = useQuery({
    queryKey: ["oauth-connections"],
    queryFn: () => fetchJson<IntegrationConnectionStatus[]>("/api/oauth/connections"),
    enabled: true,
    staleTime: 15_000,
  });

  const state = useIntegrationWizardState({
    builtInConnectors,
    onStatus,
    searchParams,
  });

  const effectiveSelectedConnection = useMemo(
    () =>
      connectionStatusesQuery.data?.find(
        (connection) =>
          connection.integrationKey ===
          (state.draft.key.trim() || state.draft.builtInSlug),
      ) ?? null,
    [connectionStatusesQuery.data, state.draft.builtInSlug, state.draft.key],
  );

  const canDiscover =
    !!state.draft.kind &&
    !!state.draft.key.trim() &&
    !!state.draft.name.trim() &&
    (state.draft.kind === "built_in"
      ? !!state.draft.builtInSlug.trim() &&
        (state.requiresOAuthConnection
          ? state.oauthConnectionEnabled && !!effectiveSelectedConnection
          : hasBuiltInCredentialInput(state.draft, state.selectedConnector))
      : !!state.draft.serverUrl.trim());

  const discoverMutation = useMutation({
    mutationFn: async () =>
      fetchJson<DiscoveryResponse>("/api/integrations/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildDiscoverPayload(state.draft, state.selectedConnector)),
      }),
    onMutate: () => {
      const providerName =
        state.selectedConnector?.name || state.draft.name.trim() || state.draft.key.trim();
      state.setDiscoverFeedback({
        tone: "info",
        message: `Discovering functions for ${providerName}… Loading the connector's available function catalog.`,
      });
      onStatus(null);
    },
    onSuccess: (result) => {
      state.applyDiscoveryResult(result);
      const message = `Discovered ${Object.keys(result.functions).length} functions. Review their default access before saving.`;
      state.setDiscoverFeedback({
        tone: "success",
        message,
      });
      onStatus(message);
    },
    onError: (error: Error) => {
      const message = `Discover failed: ${error.message}`;
      state.setDiscoverFeedback({
        tone: "error",
        message,
        debugDetails:
          error instanceof ApiRequestError ? error.debugDetails : undefined,
      });
      onStatus(message);
    },
  });

  const createMutation = useMutation({
    mutationFn: async () =>
      fetchJson("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildCreatePayload(
            state.draft,
            state.discovery as DiscoveryResponse,
            state.functionModes,
          ),
        ),
      }),
    onSuccess: async () => {
      const functionCount = state.discovery
        ? Object.keys(state.discovery.functions).length
        : 0;
      onStatus(
        `Created ${state.draft.name || state.draft.key} with ${functionCount} discovered functions.`,
      );
      await onCreated();
      state.resetAfterCreate();
    },
    onError: (error: Error) => {
      onStatus(error.message);
    },
  });

  return (
    <Card className="p-6">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row">
        <StepBadge
          step={1}
          label="Choose connector type"
          active={state.step === 1}
          complete={state.step > 1}
        />
        <StepBadge
          step={2}
          label="Connect and discover functions"
          active={state.step === 2}
          complete={state.step > 2}
        />
        <StepBadge
          step={3}
          label="Review access defaults"
          active={state.step === 3}
          complete={false}
        />
      </div>

      <IntegrationWizardIntro />

      {state.step === 1 ? (
        <IntegrationWizardStepKind
          selectedKind={state.draft.kind}
          onSelectKind={state.selectKind}
        />
      ) : null}

      {state.step === 2 ? (
        <IntegrationWizardStepConnect
          builtInConnectors={builtInConnectors}
          builtInConnectorsError={
            builtInConnectorsQuery.isError
              ? (builtInConnectorsQuery.error as Error).message
              : null
          }
          builtInConnectorsPending={builtInConnectorsQuery.isPending}
          canDiscover={canDiscover}
          connectorSearch={state.connectorSearch}
          discoverFeedback={state.discoverFeedback}
          discoverPending={discoverMutation.isPending}
          draft={state.draft}
          oauthConnectionEnabled={state.oauthConnectionEnabled}
          redirectSection={redirectSection}
          requiresOAuthConnection={state.requiresOAuthConnection}
          selectedConnection={effectiveSelectedConnection}
          selectedConnector={state.selectedConnector}
          setDraft={state.setDraft}
          onBack={() => {
            state.setDiscoverFeedback(null);
            state.setStep(1);
          }}
          onConnectorSearchChange={state.handleConnectorSearchChange}
          onDiscover={() => discoverMutation.mutate()}
        />
      ) : null}

      {state.step === 3 && state.discovery ? (
        <IntegrationWizardStepReview
          allMatchingSelected={state.allMatchingSelected}
          createPending={createMutation.isPending}
          discovery={state.discovery}
          draftKey={state.draft.key}
          draftName={state.draft.name}
          expandedFunctions={state.expandedFunctions}
          filteredReviewedFunctions={state.filteredReviewedFunctions}
          functionModes={state.functionModes}
          functionSearch={state.functionSearch}
          hasMatchingFunctions={state.hasMatchingFunctions}
          kind={state.draft.kind ?? "built_in"}
          matchingFunctionNames={state.matchingFunctionNames}
          reviewedFunctions={state.reviewedFunctions}
          selectedFunctionCount={state.selectedFunctionCount}
          selectedFunctionNames={state.selectedFunctionNames}
          selectedFunctions={state.selectedFunctions}
          selectedMatchingCount={state.selectedMatchingCount}
          onBack={() => state.setStep(2)}
          onCreate={() => createMutation.mutate()}
          onFunctionSearchChange={state.setFunctionSearch}
          onSetAccessModeForFunctions={state.setAccessModeForFunctions}
          onSetFunctionMode={(name, nextMode) =>
            state.setFunctionModes((current) => ({
              ...current,
              [name]: nextMode,
            }))
          }
          onSetSelectedFunctions={state.setSelectedFunctions}
          onSetSelectedStateForFunctions={state.setSelectedStateForFunctions}
          onToggleFunctionExpanded={state.toggleFunctionExpanded}
        />
      ) : null}
    </Card>
  );
};
