"use client";

import { RefreshCw } from "lucide-react";
import { type FormEvent } from "react";

import {
  AccessModeSlider,
  getToolAccessMode,
} from "@/src/components/integrations/tool-access-controls";
import { IntegrationEnableRow } from "@/src/components/integrations/integration-enable-row";
import { IntegrationLogoBadge } from "@/src/components/integrations/integration-logo-badge";
import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { BrandButton } from "@/src/components/ui/brand-button";
import { Button } from "@/src/components/ui/button";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalFooterActionsClassName, modalShellClassName } from "@/src/components/ui/modal-shell";
import { SelectDropdown } from "@/src/components/ui/select-dropdown";
import { ADMIN_INTEGRATIONS_PAGE_COPY } from "@/src/constants/admin-integrations-page";
import { cn } from "@/src/lib/utils";
import type { ManagedConnectorDefinition } from "@/src/types/integrations-hub";

import {
  formatUpdatedAt,
  inputClassName,
  type ManagedConnectorFormState,
} from "./managed-connector-shared";

interface ManagedConnectorDetailsModalProps {
  connector: ManagedConnectorDefinition;
  form: ManagedConnectorFormState;
  provider: "mcp" | "http";
  onClose: () => void;
  onDelete: () => void;
  onToggleEnabled: (connector: ManagedConnectorDefinition) => void;
  onFormChange: (updates: Partial<ManagedConnectorFormState>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onIndexFunctions: () => void;
  onToolAccessModeChange: (
    toolName: string,
    accessMode: "enabled" | "disabled" | "approval_required",
  ) => void;
}

export function ManagedConnectorDetailsModal({
  connector,
  form,
  provider,
  onClose,
  onDelete,
  onToggleEnabled,
  onFormChange,
  onSubmit,
  onIndexFunctions,
  onToolAccessModeChange,
}: ManagedConnectorDetailsModalProps) {
  const toolCount = connector.tools.length;
  const formId = `managed-connector-form-${connector.slug}`;

  return (
    <ModalBackdrop
      ariaLabel={ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorDetailModalAriaLabel(
        connector.name,
      )}
      onClose={onClose}
    >
      <section
        data-testid={`managed-connector-details-modal-${connector.slug}`}
        data-managed-connector-details={connector.slug}
        className={cn(modalShellClassName("xl"), "min-h-0 max-h-[90vh] gap-0")}
      >
        <ModalCloseButton
          onClose={onClose}
          testId={`managed-connector-details-modal-close-${connector.slug}`}
          disabled={form.submitting || form.deleting || form.indexing}
        />

        <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto px-7 pb-4 pt-7">
          <div className="flex items-start gap-3 pr-6">
            <IntegrationLogoBadge
              slug={connector.slug}
              name={connector.name}
              logoUrl={connector.logoUrl}
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-white">{connector.name}</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--oh-text-secondary)]">
                {connector.description}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-[var(--oh-text-secondary)]">
                {connector.slug} · {toolCount} tool
                {toolCount === 1 ? "" : "s"} · updated {formatUpdatedAt(connector.updatedAt)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <IntegrationEnableRow
              integrationKey={connector.slug}
              enabled={connector.enabled}
              disabled={form.submitting || form.deleting || form.indexing}
              onToggle={(nextEnabled) => {
                if (nextEnabled !== connector.enabled) {
                  onToggleEnabled(connector);
                }
              }}
            />
          </div>

          <div
            id={`managed-connector-details-${connector.slug}`}
            className="mt-6 overflow-hidden rounded-xl border border-[var(--oh-border)] bg-[var(--oh-bg-input)]"
          >
            <div className="border-b border-[var(--oh-border)] px-4 py-4 text-sm text-[var(--oh-text-secondary)]">
              {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorDetailIntro}
              {connector.authStrategy === "oauth2" &&
              connector.oauthClientStatus === "unreadable" ? (
                <p className="mt-2 text-sm text-[var(--oh-color-danger)]">
                  {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorOAuthRepairHint}
                </p>
              ) : null}
            </div>

            <div className="border-b border-[var(--oh-border)] px-4 py-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorIndexedToolsTitle}
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-[var(--oh-text-secondary)]">
                    {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorIndexedToolsDescription}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="shrink-0 gap-2 whitespace-nowrap"
                  disabled={form.submitting || form.deleting || form.indexing}
                  onClick={() => onIndexFunctions()}
                >
                  <RefreshCw
                    className={cn("h-4 w-4", form.indexing && "animate-spin")}
                  />
                  {form.indexing
                    ? ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorIndexingLabel
                    : connector.tools.length > 0
                      ? ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorRefreshToolsLabel
                      : ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorIndexToolsLabel}
                </Button>
              </div>

              {connector.tools.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--oh-text-secondary)]">
                  {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorNoIndexedTools}
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {connector.tools
                    .slice()
                    .sort((left, right) => left.name.localeCompare(right.name))
                    .map((toolSpec) => {
                      const accessMode = getToolAccessMode({
                        name: toolSpec.name,
                        description: toolSpec.description,
                        enabled: toolSpec.accessMode !== "disabled",
                        accessMode: toolSpec.accessMode,
                        fineGrainedPermissions: true,
                        defaultScopes: toolSpec.defaultScopes,
                        executionMode: "provider",
                        config: {},
                      });

                      return (
                        <div
                          key={toolSpec.name}
                          className="rounded-xl border border-[var(--oh-border)] bg-[var(--oh-surface-subtle)] px-4 py-4"
                          data-managed-connector-function={toolSpec.name}
                        >
                          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white">
                                {toolSpec.name}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-[var(--oh-text-secondary)]">
                                {toolSpec.description ||
                                  ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorNoToolDescription}
                              </p>
                            </div>
                            <AccessModeSlider
                              toolName={toolSpec.name}
                              mode={accessMode}
                              onChange={(nextMode) =>
                                onToolAccessModeChange(toolSpec.name, nextMode)
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <form
              id={formId}
              className="grid gap-3 p-4 md:grid-cols-2"
              onSubmit={onSubmit}
            >
              <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)]">
                {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorProviderTypeLabel}
                <SelectDropdown
                  testId={`managed-connector-provider-select-${connector.slug}`}
                  value={form.provider}
                  onChange={(nextValue) =>
                    onFormChange({
                      provider: nextValue as "mcp" | "http",
                    })
                  }
                  options={[
                    { value: "mcp", label: ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorProviderMcp },
                    {
                      value: "http",
                      label: ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorProviderHttp,
                    },
                  ]}
                  ariaLabel={ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorProviderTypeLabel}
                />
              </label>
              <div className="flex items-end text-[11px] leading-5 text-[var(--oh-text-secondary)]">
                {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorUpdatedLabel}{" "}
                {formatUpdatedAt(connector.updatedAt)}
              </div>

              {provider === "mcp" ? (
                <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)] md:col-span-2">
                  {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorMcpServerUrlLabel}
                  <input
                    type="url"
                    value={form.serverUrl}
                    onChange={(event) =>
                      onFormChange({
                        serverUrl: event.target.value,
                      })
                    }
                    className={inputClassName}
                  />
                </label>
              ) : (
                <>
                  <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)] md:col-span-2">
                    {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorApiBaseUrlLabel}
                    <input
                      type="url"
                      value={form.apiBaseUrl}
                      onChange={(event) =>
                        onFormChange({
                          apiBaseUrl: event.target.value,
                        })
                      }
                      className={inputClassName}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)] md:col-span-2">
                    {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorOpenApiUrlLabel}
                    <input
                      type="url"
                      value={form.openApiUrl}
                      onChange={(event) =>
                        onFormChange({
                          openApiUrl: event.target.value,
                        })
                      }
                      placeholder="https://developers.example.com/openapi.json"
                      className={inputClassName}
                    />
                    <span className="text-[11px] leading-5 text-[var(--oh-text-secondary)]">
                      {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorOpenApiHint}
                    </span>
                  </label>
                </>
              )}

              {connector.authStrategy === "oauth2" ? (
                <>
                  <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)]">
                    {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorAuthorizationUrlLabel}
                    <input
                      type="url"
                      value={form.authorizationUrl}
                      onChange={(event) =>
                        onFormChange({
                          authorizationUrl: event.target.value,
                        })
                      }
                      className={inputClassName}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)]">
                    {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorTokenUrlLabel}
                    <input
                      type="url"
                      value={form.tokenUrl}
                      onChange={(event) =>
                        onFormChange({
                          tokenUrl: event.target.value,
                        })
                      }
                      className={inputClassName}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)] md:col-span-2">
                    {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorRequiredScopesLabel}
                    <input
                      type="text"
                      value={form.scopes}
                      onChange={(event) =>
                        onFormChange({
                          scopes: event.target.value,
                        })
                      }
                      className={inputClassName}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)] md:col-span-2">
                    {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorOptionalScopesLabel}
                    <input
                      type="text"
                      value={form.optionalScopes}
                      onChange={(event) =>
                        onFormChange({
                          optionalScopes: event.target.value,
                        })
                      }
                      placeholder="contacts.write, settings.read"
                      className={inputClassName}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)]">
                    {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorReplaceOAuthClientIdLabel}
                    <input
                      type="text"
                      value={form.oauthClientId}
                      onChange={(event) =>
                        onFormChange({
                          oauthClientId: event.target.value,
                        })
                      }
                      className={inputClassName}
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs text-[var(--oh-text-secondary)]">
                    {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorReplaceOAuthClientSecretLabel}
                    <input
                      type="password"
                      value={form.oauthClientSecret}
                      onChange={(event) =>
                        onFormChange({
                          oauthClientSecret: event.target.value,
                        })
                      }
                      className={inputClassName}
                    />
                  </label>
                </>
              ) : null}

              {form.message ? (
                <p
                  className={cn(
                    "md:col-span-2",
                    form.status === "error"
                      ? "text-sm text-[var(--oh-color-danger)]"
                      : "text-sm text-[var(--oh-text-secondary)]",
                  )}
                >
                  {form.message}
                </p>
              ) : null}
            </form>
          </div>
        </div>

        <div className={cn(modalFooterActionsClassName, "border-t border-[var(--oh-border)] px-7 py-4")}>
          <Button
            type="button"
            variant="danger"
            disabled={form.submitting || form.deleting || form.indexing}
            data-testid={`managed-connector-delete-${connector.slug}`}
            aria-label={ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorDeleteAriaLabel(
              connector.name,
            )}
            onClick={onDelete}
          >
            {form.deleting
              ? ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorDeletingLabel
              : ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorDeleteLabel}
          </Button>
          <BrandButton type="button" variant="secondary" onClick={onClose}>
            {ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorCloseLabel}
          </BrandButton>
          <Button
            type="submit"
            form={formId}
            disabled={form.submitting || form.deleting || form.indexing}
            data-testid={`managed-connector-save-${connector.slug}`}
          >
            {form.submitting
              ? ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorSavingLabel
              : ADMIN_INTEGRATIONS_PAGE_COPY.managedConnectorSaveChangesLabel}
          </Button>
        </div>
      </section>
    </ModalBackdrop>
  );
}
