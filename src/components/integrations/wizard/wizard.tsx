"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { fetchJson, ApiRequestError } from "@/src/lib/fetch-json";
import { catalogOptionsToConnectorOptions } from "@/src/lib/catalog-mappers";
import { ConnectStep } from "@/src/components/integrations/wizard/connect-step";
import { ReviewStep } from "@/src/components/integrations/wizard/review-step";
import {
  OAuthReturnBanner,
  WizardFeedback,
  WizardHeader,
  type OAuthReturnStatus,
} from "@/src/components/integrations/wizard/shared";
import { useWizardState } from "@/src/components/integrations/wizard/use-wizard-state";
import type {
  IntegrationCatalogOption,
  ManagedConnectorOption,
  IntegrationConnectionStatus,
} from "@/src/types/integrations-hub";
import {
  authStrategyLabel,
  buildCreatePayload,
  buildDiscoverPayload,
  formatDebugDetails,
  getWizardFlow,
  hasManagedConnectorCredentialInput,
  type DiscoverFeedback,
  type DiscoveryResponse,
} from "@/src/components/integrations/wizard/utils";
import { type AdminSection } from "@/src/lib/admin-routes";
import { useTracking } from "@/src/hooks/use-tracking";
import { cn } from "@/src/lib/utils";

interface IntegrationWizardProps {
  existingIntegrationKeys?: Set<string>;
  isAdmin?: boolean;
  oauthStatus?: OAuthReturnStatus | null;
  onCreated: () => Promise<void>;
  onStatus: (message: string | null) => void;
  redirectSection?: AdminSection;
}

export const IntegrationWizard = ({
  existingIntegrationKeys,
  isAdmin = true,
  oauthStatus = null,
  onCreated,
  onStatus,
  redirectSection = "integrations",
}: IntegrationWizardProps) => {
  const searchParams = useSearchParams();
  const { track } = useTracking();
  const [createFeedback, setCreateFeedback] = useState<DiscoverFeedback | null>(null);
  const [activePane, setActivePane] = useState<"connect" | "review">("connect");

  const managedConnectorsQuery = useQuery({
    queryKey: ["managed-connectors"],
    queryFn: async () => {
      const catalog = await fetchJson<IntegrationCatalogOption[]>(
        "/api/integrations?filter=enabled",
      );
      return catalogOptionsToConnectorOptions(catalog);
    },
    enabled: true,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const managedConnectors = useMemo(
    () => managedConnectorsQuery.data ?? [],
    [managedConnectorsQuery.data],
  );

  const connectionStatusesQuery = useQuery({
    queryKey: ["oauth-connections"],
    queryFn: () => fetchJson<IntegrationConnectionStatus[]>("/api/oauth/connections"),
    enabled: true,
    staleTime: 15_000,
  });

  const oauthReturnIntegrationKey = searchParams.get("integrationKey")?.trim() || "";
  const oauthReturnConnectorSlug =
    searchParams.get("managedConnector")?.trim() || "";
  const wizardFlow = getWizardFlow(searchParams);

  const state = useWizardState({
    existingIntegrationKeys,
    managedConnectors,
    onStatus,
    searchParams,
  });

  const effectiveSelectedConnection = useMemo(
    () => {
      const draftIntegrationKey =
        state.draft.key.trim() || state.draft.managedConnectorSlug;
      return (
        connectionStatusesQuery.data?.find(
          (connection) => connection.integrationKey === draftIntegrationKey,
        ) ??
        // The OAuth callback keeps the key used to connect in the URL. Use it
        // as a stable fallback so editing the draft key does not discard the
        // saved connection before discovery can bind its connectionId.
        connectionStatusesQuery.data?.find(
          (connection) =>
            !!oauthReturnIntegrationKey &&
            state.draft.managedConnectorSlug === oauthReturnConnectorSlug &&
            connection.integrationKey === oauthReturnIntegrationKey,
        ) ??
        null
      );
    },
    [
      connectionStatusesQuery.data,
      oauthReturnConnectorSlug,
      oauthReturnIntegrationKey,
      state.draft.managedConnectorSlug,
      state.draft.key,
    ],
  );

  useEffect(() => {
    const connector = state.selectedConnector;
    const connections = connectionStatusesQuery.data ?? [];
    if (
      !connector ||
      !connector.connectionModel ||
      searchParams.get("integrationKey") ||
      state.draft.key.trim() !== connector.slug ||
      !connections.some((connection) => connection.integrationKey === connector.slug)
    ) {
      return;
    }
    const usedKeys = new Set(connections.map((connection) => connection.integrationKey));
    let suffix = 2;
    while (usedKeys.has(`${connector.slug}-${suffix}`)) {
      suffix += 1;
    }
    state.setDraft((current) => ({
      ...current,
      key: `${connector.slug}-${suffix}`,
      name: `${connector.name} ${suffix}`,
      resourceId: "",
    }));
  }, [
    connectionStatusesQuery.data,
    searchParams,
    state.draft.key,
    state.selectedConnector,
    state.setDraft,
  ]);

  useEffect(() => {
    const primaryResource = effectiveSelectedConnection?.resources?.[0];
    if (!primaryResource || state.draft.resourceId) {
      return;
    }
    if (state.selectedConnector?.connectionModel?.selectionMode === "automatic") {
      state.setDraft((current) => ({
        ...current,
        resourceId: primaryResource.id,
        name:
          primaryResource.displayName &&
          (current.name === state.selectedConnector?.name ||
            current.name === state.selectedConnector?.slug)
            ? `${state.selectedConnector.name} - ${primaryResource.displayName}`
            : current.name,
      }));
    }
  }, [
    effectiveSelectedConnection,
    state.draft.resourceId,
    state.selectedConnector,
    state.setDraft,
  ]);

  const hasDirectConnection = useMemo(
    () => {
      const draftKey = state.draft.key.trim() || state.draft.managedConnectorSlug;
      return !!connectionStatusesQuery.data?.some(
        (connection) => connection.integrationKey === draftKey,
      );
    },
    [connectionStatusesQuery.data, state.draft.key, state.draft.managedConnectorSlug],
  );

  const requiresResourceSelection =
    state.selectedConnector?.connectionModel?.selectionMode === "post_auth";

  const canDiscover =
    !!state.draft.kind &&
    !!state.draft.key.trim() &&
    !!state.draft.name.trim() &&
    (state.draft.kind === "managed"
      ? !!state.draft.managedConnectorSlug.trim() &&
        (state.requiresOAuthConnection
          ? state.oauthConnectionEnabled &&
            !!effectiveSelectedConnection &&
            (!requiresResourceSelection || !!state.draft.resourceId.trim())
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
        body: JSON.stringify(
          buildDiscoverPayload(
            input.draft,
            input.connector,
            effectiveSelectedConnection,
          ),
        ),
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
      state.setDiscoverFeedback(null);
      setActivePane("review");
      const providerName =
        input.connector?.name || input.draft.name.trim() || input.draft.key.trim();
      const discoveredToolCount = Object.keys(result.tools).length;
      const message = `Discovered ${discoveredToolCount} tool${discoveredToolCount === 1 ? "" : "s"} for ${providerName}. Review their default access before saving.`;
      onStatus(message);
      track("integration_tools_discovered", {
        integration_kind: input.draft.kind ?? "mcp",
        connector_slug: input.connector?.slug,
        auth_strategy: result.authStrategy,
        tool_count: discoveredToolCount,
      });
    },
    onError: (error: Error, input) => {
      const message = `Discover failed: ${error.message}`;
      state.setDiscoverFeedback({
        tone: "error",
        message,
        debugDetails:
          error instanceof ApiRequestError ? error.debugDetails : undefined,
      });
      onStatus(message);
      track("integration_setup_failed", {
        stage: "discovery",
        integration_kind: input.draft.kind ?? undefined,
        connector_slug: input.connector?.slug,
      });
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
      const accessModes = Object.values(payload.tools).map((tool) => tool.accessMode);
      const message = `Created ${payload.name || payload.key} with ${toolCount} discovered tool${toolCount === 1 ? "" : "s"}.`;
      setCreateFeedback(null);
      onStatus(message);
      track("integration_created", {
        integration_kind: payload.kind === "api" ? "api" : "mcp",
        connector_slug:
          typeof payload.config.managedConnectorSlug === "string"
            ? payload.config.managedConnectorSlug
            : undefined,
        auth_strategy: payload.authStrategy,
        tool_count: toolCount,
        enabled_tool_count: accessModes.filter((mode) => mode !== "disabled").length,
        approval_required_tool_count: accessModes.filter(
          (mode) => mode === "approval_required",
        ).length,
      });
      await onCreated();
      setActivePane("connect");
      state.resetAfterCreate();
    },
    onError: (error: Error, payload) => {
      const message = `Create failed: ${error.message}`;
      setCreateFeedback({
        tone: "error",
        message,
        debugDetails:
          error instanceof ApiRequestError ? error.debugDetails : undefined,
      });
      onStatus(message);
      track("integration_setup_failed", {
        stage: "create",
        integration_kind:
          typeof payload.config.managedConnectorSlug === "string" ? "managed" : "mcp",
        connector_slug:
          typeof payload.config.managedConnectorSlug === "string"
            ? payload.config.managedConnectorSlug
            : undefined,
      });
    },
  });

  const wizardHeader = (
    <WizardHeader
      title={state.selectedConnector?.name}
      description={state.selectedConnector?.description}
      logoSlug={state.selectedConnector?.slug}
      logoUrl={state.selectedConnector?.logoUrl}
      authLabel={
        state.selectedConnector
          ? authStrategyLabel(state.selectedConnector.authStrategy)
          : null
      }
      isConnected={Boolean(effectiveSelectedConnection)}
    />
  );

  return (
    <div
      className="flex min-h-0 flex-col overflow-hidden"
      data-testid="integration-wizard"
      data-wizard-pane={activePane}
    >
      <div
        className={cn(
          "flex w-[200%] items-start transition-transform duration-300 ease-out motion-reduce:transition-none",
          activePane === "review" ? "-translate-x-1/2" : "translate-x-0",
        )}
      >
        <section
          className="flex w-1/2 shrink-0 flex-col px-7 pb-7 pt-7"
          aria-hidden={activePane !== "connect"}
          data-testid="integration-wizard-connect-pane"
        >
          {state.selectedConnector ? wizardHeader : null}
          {oauthStatus ? <OAuthReturnBanner status={oauthStatus} /> : null}
          <div className="mt-1">
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
              isAdmin={isAdmin}
              oauthConnectionEnabled={state.oauthConnectionEnabled}
              redirectSection={redirectSection}
              requiresOAuthConnection={state.requiresOAuthConnection}
              selectedConnection={effectiveSelectedConnection}
              hasDirectConnection={hasDirectConnection}
              selectedConnector={state.selectedConnector}
              setDraft={state.setDraft}
              showConnectorPicker={wizardFlow === "add"}
              onConnectorSearchChange={state.handleConnectorSearchChange}
              onDiscover={() =>
                discoverMutation.mutate({
                  draft: state.draft,
                  connector: state.selectedConnector,
                })
              }
              onSelectKind={(kind) => {
                setActivePane("connect");
                state.selectKind(kind);
              }}
            />
          </div>
        </section>

        <section
          className="flex max-h-[90vh] w-1/2 shrink-0 flex-col overflow-hidden px-7 pb-7 pt-7"
          aria-hidden={activePane !== "review"}
          data-testid="integration-wizard-review-pane"
        >
          {state.selectedConnector ? wizardHeader : null}
          {createFeedback ? (
            <div className="mb-4 shrink-0">
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
          {state.discovery ? (
            <ReviewStep
              allMatchingSelected={state.allMatchingSelected}
              createPending={createMutation.isPending}
              expandedTools={state.expandedTools}
              filteredReviewedTools={state.filteredReviewedTools}
              toolModes={state.toolModes}
              toolSearch={state.toolSearch}
              hasMatchingTools={state.hasMatchingTools}
              matchingToolNames={state.matchingToolNames}
              reviewedTools={state.reviewedTools}
              selectedToolCount={state.selectedToolCount}
              selectedToolNames={state.selectedToolNames}
              selectedTools={state.selectedTools}
              selectedMatchingCount={state.selectedMatchingCount}
              onBack={() => {
                setCreateFeedback(null);
                setActivePane("connect");
                state.resetToConnectStep();
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
          ) : null}
        </section>
      </div>
    </div>
  );
};
