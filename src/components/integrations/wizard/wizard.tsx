"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { fetchJson, ApiRequestError } from "@/src/lib/fetch-json";
import { ConnectStep } from "@/src/components/integrations/wizard/connect-step";
import { KindStep } from "@/src/components/integrations/wizard/kind-step";
import { ReviewStep } from "@/src/components/integrations/wizard/review-step";
import {
  WizardIntro,
  StepBadge,
} from "@/src/components/integrations/wizard/shared";
import { useWizardState } from "@/src/components/integrations/wizard/use-wizard-state";
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

  const state = useWizardState({
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
    mutationFn: async (input: {
      draft: typeof state.draft;
      connector: BuiltInConnectorOption | null;
    }) =>
      fetchJson<DiscoveryResponse>("/api/integrations/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildDiscoverPayload(input.draft, input.connector)),
      }),
    onMutate: (input) => {
      const providerName =
        input.connector?.name || input.draft.name.trim() || input.draft.key.trim();
      state.setDiscoverFeedback({
        tone: "info",
        message: `Discovering tools for ${providerName}… Loading the connector's available tool catalog.`,
      });
      onStatus(null);
    },
    onSuccess: (result, input) => {
      state.applyDiscoveryResult(result);
      const providerName =
        input.connector?.name || input.draft.name.trim() || input.draft.key.trim();
      const discoveredToolCount = Object.keys(result.functions).length;
      const message = `Discovered ${discoveredToolCount} tool${discoveredToolCount === 1 ? "" : "s"} for ${providerName}. Review their default access before saving.`;
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
    mutationFn: async (
      payload: ReturnType<typeof buildCreatePayload>,
    ) =>
      fetchJson("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: async (_result, payload) => {
      const toolCount = Object.keys(payload.functions).length;
      onStatus(
        `Created ${payload.name || payload.key} with ${toolCount} discovered tool${toolCount === 1 ? "" : "s"}.`,
      );
      await onCreated();
      state.resetAfterCreate();
    },
    onError: (error: Error) => {
      onStatus(error.message);
    },
  });

  const integrationDisplayName =
    state.draft.kind === "built_in"
      ? (state.selectedConnector?.name ?? state.draft.name.trim()) || state.draft.key.trim()
      : state.draft.name.trim() || state.draft.key.trim();

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
          label="Connect and discover tools"
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

      <WizardIntro />

      {state.step === 1 ? (
        <KindStep
          selectedKind={state.draft.kind}
          onSelectKind={state.selectKind}
        />
      ) : null}

      {state.step === 2 ? (
        <ConnectStep
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
          onDiscover={() =>
            discoverMutation.mutate({
              draft: state.draft,
              connector: state.selectedConnector,
            })
          }
        />
      ) : null}

      {state.step === 3 && state.discovery ? (
        <ReviewStep
          allMatchingSelected={state.allMatchingSelected}
          createPending={createMutation.isPending}
          discovery={state.discovery}
          draftKey={state.draft.key}
          draftName={integrationDisplayName}
          expandedTools={state.expandedTools}
          filteredReviewedTools={state.filteredReviewedTools}
          toolModes={state.toolModes}
          toolSearch={state.toolSearch}
          hasMatchingTools={state.hasMatchingTools}
          kind={state.draft.kind ?? "built_in"}
          matchingToolNames={state.matchingToolNames}
          reviewedTools={state.reviewedTools}
          selectedToolCount={state.selectedToolCount}
          selectedToolNames={state.selectedToolNames}
          selectedTools={state.selectedTools}
          selectedMatchingCount={state.selectedMatchingCount}
          onBack={() => state.setStep(2)}
          onCreate={() =>
            createMutation.mutate(
              buildCreatePayload(
                state.draft,
                state.discovery as DiscoveryResponse,
                state.toolModes,
                state.selectedConnector,
              ),
            )
          }
          onToolSearchChange={state.setToolSearch}
          onSetAccessModeForTools={state.setAccessModeForTools}
          onSetToolMode={(name, nextMode) =>
            state.setToolModes((current) => ({
              ...current,
              [name]: nextMode,
            }))
          }
          onSetSelectedTools={state.setSelectedTools}
          onSetSelectedStateForTools={state.setSelectedStateForTools}
          onToggleToolExpanded={state.toggleToolExpanded}
        />
      ) : null}
    </Card>
  );
};
