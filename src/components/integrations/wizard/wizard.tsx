"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { fetchJson, ApiRequestError } from "@/src/lib/fetch-json";
import { ConnectStep } from "@/src/components/integrations/wizard/connect-step";
import { KindStep } from "@/src/components/integrations/wizard/kind-step";
import { ReviewStep } from "@/src/components/integrations/wizard/review-step";
import {
  WizardFeedback,
  WizardIntro,
  StepBadge,
} from "@/src/components/integrations/wizard/shared";
import { useWizardState } from "@/src/components/integrations/wizard/use-wizard-state";
import { Card } from "@/src/components/ui/card";
import { filterReadyManagedConnectors } from "@/src/lib/integrations/connector-readiness";
import type {
  ManagedConnectorOption,
  IntegrationConnectionStatus,
} from "@/src/types/context-layer";
import {
  buildCreatePayload,
  buildDiscoverPayload,
  formatDebugDetails,
  hasManagedConnectorCredentialInput,
  type DiscoverFeedback,
  type DiscoveryResponse,
} from "@/src/components/integrations/wizard/utils";
import { type AdminSection } from "@/src/lib/admin-routes";

interface IntegrationWizardProps {
  isAdmin?: boolean;
  onCreated: () => Promise<void>;
  onStatus: (message: string | null) => void;
  redirectSection?: AdminSection;
}

export const IntegrationWizard = ({
  isAdmin = true,
  onCreated,
  onStatus,
  redirectSection = "integrations",
}: IntegrationWizardProps) => {
  const searchParams = useSearchParams();
  const [createFeedback, setCreateFeedback] = useState<DiscoverFeedback | null>(null);

  const managedConnectorsQuery = useQuery({
    queryKey: ["managed-connectors"],
    queryFn: () =>
      fetchJson<ManagedConnectorOption[]>("/api/integrations/managed-connectors"),
    enabled: true,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const managedConnectors = useMemo(
    () => filterReadyManagedConnectors(managedConnectorsQuery.data ?? []),
    [managedConnectorsQuery.data],
  );

  const connectionStatusesQuery = useQuery({
    queryKey: ["oauth-connections"],
    queryFn: () => fetchJson<IntegrationConnectionStatus[]>("/api/oauth/connections"),
    enabled: true,
    staleTime: 15_000,
  });

  const state = useWizardState({
    managedConnectors,
    onStatus,
    searchParams,
  });

  const effectiveSelectedConnection = useMemo(
    () =>
      connectionStatusesQuery.data?.find(
        (connection) =>
          connection.integrationKey ===
          (state.draft.key.trim() || state.draft.managedConnectorSlug),
      ) ?? null,
    [connectionStatusesQuery.data, state.draft.managedConnectorSlug, state.draft.key],
  );

  const canDiscover =
    !!state.draft.kind &&
    !!state.draft.key.trim() &&
    !!state.draft.name.trim() &&
    (state.draft.kind === "managed"
      ? !!state.draft.managedConnectorSlug.trim() &&
        (state.requiresOAuthConnection
          ? state.oauthConnectionEnabled && !!effectiveSelectedConnection
          : hasManagedConnectorCredentialInput(state.draft, state.selectedConnector))
      : !!state.draft.serverUrl.trim());

  const discoverMutation = useMutation({
    mutationFn: async (input: {
      draft: typeof state.draft;
      connector: ManagedConnectorOption | null;
    }) =>
      fetchJson<DiscoveryResponse>("/api/integrations/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildDiscoverPayload(input.draft, input.connector)),
      }),
    onMutate: (input) => {
      const providerName =
        input.connector?.name || input.draft.name.trim() || input.draft.key.trim();
      setCreateFeedback(null);
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
      const discoveredToolCount = Object.keys(result.tools).length;
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
    onMutate: () => {
      setCreateFeedback(null);
      onStatus(null);
    },
    onSuccess: async (_result, payload) => {
      const toolCount = Object.keys(payload.tools).length;
      const message = `Created ${payload.name || payload.key} with ${toolCount} discovered tool${toolCount === 1 ? "" : "s"}.`;
      setCreateFeedback(null);
      onStatus(message);
      await onCreated();
      state.resetAfterCreate();
    },
    onError: (error: Error) => {
      const message = `Create failed: ${error.message}`;
      setCreateFeedback({
        tone: "error",
        message,
        debugDetails:
          error instanceof ApiRequestError ? error.debugDetails : undefined,
      });
      onStatus(message);
    },
  });

  const integrationDisplayName =
    state.draft.kind === "managed"
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
          allowRawMcpInstall={isAdmin}
          selectedKind={state.draft.kind}
          onSelectKind={state.selectKind}
        />
      ) : null}

      {state.step === 2 ? (
        <ConnectStep
          managedConnectors={managedConnectors}
          managedConnectorsError={
            managedConnectorsQuery.isError
              ? (managedConnectorsQuery.error as Error).message
              : null
          }
          managedConnectorsPending={managedConnectorsQuery.isPending}
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
        <>
          {createFeedback ? (
            <div className="mb-4">
              <WizardFeedback tone={createFeedback.tone} testId="create-feedback">
                <p>{createFeedback.message}</p>
                {createFeedback.debugDetails ? (
                  <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">
                      Admin diagnostics
                    </p>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-white/80">
                      {formatDebugDetails(createFeedback.debugDetails)}
                    </pre>
                  </div>
                ) : null}
              </WizardFeedback>
            </div>
          ) : null}
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
            kind={state.draft.kind ?? "managed"}
            matchingToolNames={state.matchingToolNames}
            reviewedTools={state.reviewedTools}
            selectedToolCount={state.selectedToolCount}
            selectedToolNames={state.selectedToolNames}
            selectedTools={state.selectedTools}
            selectedMatchingCount={state.selectedMatchingCount}
            onBack={() => {
              setCreateFeedback(null);
              state.setStep(2);
            }}
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
        </>
      ) : null}
    </Card>
  );
};
