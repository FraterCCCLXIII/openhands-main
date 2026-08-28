"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";

import { IntegrationLogoBadge } from "@/src/components/integrations/integration-logo-badge";
import { IntegrationsSearchInput } from "@/src/components/integrations/integrations-search-input";
import { ModalCloseButton } from "@/src/components/shared/modals/modal-close-button";
import { BrandButton } from "@/src/components/ui/brand-button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { ModalBackdrop } from "@/src/components/ui/modal-backdrop";
import { modalFooterActionsClassName, modalShellClassName } from "@/src/components/ui/modal-shell";
import { integrationWizardInputClassName } from "@/src/components/integrations/wizard/utils";
import {
  formatRequestIntegrationSelectedLabel,
  formatRequestIntegrationSubmitLabel,
  getAuthTypeLabel,
  INTEGRATIONS_PAGE_COPY,
} from "@/src/constants/integrations-page";
import { fetchJson } from "@/src/lib/fetch-json";
import { catalogOptionsToConnectorOptions } from "@/src/lib/catalog-mappers";
import {
  buildCatalogRequestPayload,
  buildCustomRequestPayload,
  buildRequestableCatalogOptions,
  isValidOptionalHttpUrl,
  resolveSelectedCatalogEntries,
  toggleSlugSelection,
  type IntegrationRequestSource,
} from "@/src/lib/request-integration";
import { cn } from "@/src/lib/utils";
import type {
  IntegrationCatalogOption,
  IntegrationRequest,
  ManagedConnectorOption,
} from "@/src/types/integrations-hub";

const COPY = INTEGRATIONS_PAGE_COPY;

const tabButtonClassName = (active: boolean) =>
  cn(
    "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
    active
      ? "bg-white/10 text-white"
      : "text-[var(--color-text-base)] hover:bg-white/5 hover:text-white",
  );

const textareaClassName = cn(
  integrationWizardInputClassName,
  "min-h-24 h-auto resize-y py-2 leading-5",
);

interface RequestIntegrationModalProps {
  catalog?: IntegrationCatalogOption[];
  availableSlugs?: Iterable<string>;
  onClose: () => void;
  onSubmitted: (request: IntegrationRequest) => void;
}

export function RequestIntegrationModal({
  catalog,
  availableSlugs,
  onClose,
  onSubmitted,
}: RequestIntegrationModalProps) {
  const [mode, setMode] = useState<IntegrationRequestSource>("catalog");
  const [search, setSearch] = useState("");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customDocsUrl, setCustomDocsUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const catalogQuery = useQuery({
    queryKey: ["integration-catalog-all"],
    queryFn: () => fetchJson<IntegrationCatalogOption[]>("/api/integrations?filter=all"),
    enabled: catalog === undefined,
    staleTime: 30_000,
  });
  const availableQuery = useQuery({
    queryKey: ["managed-connectors"],
    queryFn: async () => {
      const enabled = await fetchJson<IntegrationCatalogOption[]>(
        "/api/integrations?filter=enabled",
      );
      return catalogOptionsToConnectorOptions(enabled);
    },
    enabled: availableSlugs === undefined,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const catalogEntries = catalog ?? catalogQuery.data ?? [];
  const resolvedAvailableSlugs =
    availableSlugs ??
    (availableQuery.data ?? []).map((connector: ManagedConnectorOption) => connector.slug);

  const requestable = useMemo(
    () =>
      buildRequestableCatalogOptions({
        catalog: catalogEntries,
        availableSlugs: resolvedAvailableSlugs,
        search,
      }),
    [catalogEntries, resolvedAvailableSlugs, search],
  );
  const selectedEntries = useMemo(
    () =>
      resolveSelectedCatalogEntries({
        catalog: catalogEntries,
        selectedSlugs,
      }),
    [catalogEntries, selectedSlugs],
  );

  const isLoading =
    catalog === undefined &&
    availableSlugs === undefined &&
    (catalogQuery.isPending || availableQuery.isPending);
  const loadError =
    catalogQuery.error instanceof Error
      ? catalogQuery.error.message
      : availableQuery.error instanceof Error
        ? availableQuery.error.message
        : null;

  const validate = (): string | null => {
    if (mode === "catalog") {
      if (selectedEntries.length === 0) return COPY.requestIntegrationSelectRequired;
      if (
        selectedEntries.some(
          (entry) => !isValidOptionalHttpUrl(entry.docsUrl ?? entry.appUrl ?? ""),
        )
      ) {
        return COPY.requestIntegrationDocsUrlInvalid;
      }
      return null;
    }
    if (!customName.trim()) return COPY.requestIntegrationNameRequired;
    if (!isValidOptionalHttpUrl(customDocsUrl)) return COPY.requestIntegrationDocsUrlInvalid;
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payloads =
      mode === "catalog"
        ? selectedEntries.map((entry) => buildCatalogRequestPayload({ entry, notes }))
        : [
            buildCustomRequestPayload({
              name: customName,
              description: customDescription,
              docsUrl: customDocsUrl,
              notes,
            }),
          ];

    setSubmitting(true);
    setError("");
    const submitted: IntegrationRequest[] = [];
    try {
      for (const payload of payloads) {
        submitted.push(
          await fetchJson<IntegrationRequest>("/api/integrations/requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
        );
      }
      const lastRequest = submitted.at(-1);
      if (lastRequest) {
        onSubmitted(lastRequest);
      }
    } catch (submitError) {
      if (mode === "catalog" && submitted.length > 0) {
        const sentSlugs = new Set(submitted.map((request) => request.slug).filter(Boolean));
        setSelectedSlugs((current) => current.filter((slug) => !sentSlugs.has(slug)));
      }
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to send the integration request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalBackdrop ariaLabel={COPY.requestIntegrationModalAriaLabel} onClose={onClose}>
      <section
        data-testid="request-integration-modal"
        className={cn(modalShellClassName("lg"), "min-h-0")}
      >
        <ModalCloseButton
          onClose={onClose}
          testId="request-integration-modal-close"
          disabled={submitting}
        />

        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <div className="custom-scrollbar-always min-h-0 flex-1 overflow-y-auto px-7 pb-4 pt-7">
            <h2 className="pr-8 text-base font-semibold text-white">
              {COPY.requestIntegrationTitle}
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">
              {COPY.requestIntegrationDescription}
            </p>

            <div
              role="tablist"
              aria-label="Request integration type"
              className="mt-5 inline-flex rounded-lg border border-[var(--oh-border)] bg-black/20 p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "catalog"}
                data-testid="request-integration-catalog-tab"
                className={tabButtonClassName(mode === "catalog")}
                onClick={() => {
                  setMode("catalog");
                  setError("");
                }}
              >
                {COPY.requestIntegrationCatalogTab}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "custom"}
                data-testid="request-integration-custom-tab"
                className={tabButtonClassName(mode === "custom")}
                onClick={() => {
                  setMode("custom");
                  setError("");
                }}
              >
                {COPY.requestIntegrationCustomTab}
              </button>
            </div>

            {mode === "catalog" ? (
              <div className="mt-4 space-y-3">
                <IntegrationsSearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder={COPY.requestIntegrationSearchPlaceholder}
                  ariaLabel={COPY.requestIntegrationSearchPlaceholder}
                  testId="request-integration-search"
                />

                {isLoading ? (
                  <p className="text-sm text-[var(--color-text-base)]">
                    {COPY.requestIntegrationLoading}
                  </p>
                ) : loadError ? (
                  <p className="text-sm text-[var(--oh-color-danger)]" role="alert">
                    {COPY.requestIntegrationLoadError}
                  </p>
                ) : requestable.length === 0 ? (
                  <p
                    data-testid="request-integration-empty"
                    className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-4 text-sm text-[var(--color-text-base)]"
                  >
                    {search.trim()
                      ? COPY.requestIntegrationSearchEmpty
                      : COPY.requestIntegrationCatalogEmpty}
                  </p>
                ) : (
                  <ul
                    data-testid="request-integration-list"
                    className="max-h-64 divide-y divide-[var(--color-border)] overflow-y-auto rounded-xl border border-[var(--color-border)]"
                  >
                    {requestable.map((entry) => {
                      const isSelected = selectedSlugs.includes(entry.slug);
                      const authStrategy = entry.connectionDefaults?.authStrategy;
                      return (
                        <li key={entry.slug}>
                          <button
                            type="button"
                            data-testid={`request-integration-option-${entry.slug}`}
                            aria-pressed={isSelected}
                            onClick={() => {
                              setSelectedSlugs((current) => toggleSlugSelection(current, entry.slug));
                              setError("");
                            }}
                            className={cn(
                              "flex w-full cursor-pointer items-start gap-3 px-3 py-3 text-left transition-colors hover:bg-[var(--color-interactive-hover)]",
                              isSelected && "bg-[var(--color-interactive-hover)]",
                            )}
                          >
                            <Checkbox
                              checked={isSelected}
                              tabIndex={-1}
                              readOnly
                              aria-hidden
                              className="pointer-events-none mt-0.5"
                            />
                            <IntegrationLogoBadge
                              slug={entry.slug}
                              name={entry.name}
                              logoUrl={entry.logoUrl}
                              iconBg={entry.iconBg}
                              iconColor={entry.iconColor}
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-medium text-white">
                                  {entry.name}
                                </span>
                                {authStrategy ? (
                                  <span className="text-xs text-[var(--color-text-muted)]">
                                    {getAuthTypeLabel(authStrategy)}
                                  </span>
                                ) : null}
                              </span>
                              {entry.description ? (
                                <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-[var(--color-text-base)]">
                                  {entry.description}
                                </span>
                              ) : null}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                <label className="grid gap-1.5 text-sm text-white">
                  <span className="font-medium">{COPY.requestIntegrationNameLabel}</span>
                  <input
                    data-testid="request-integration-custom-name"
                    className={integrationWizardInputClassName}
                    placeholder={COPY.requestIntegrationNamePlaceholder}
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                    autoComplete="off"
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-white">
                  <span className="font-medium">{COPY.requestIntegrationDescriptionLabel}</span>
                  <textarea
                    data-testid="request-integration-custom-description"
                    className={textareaClassName}
                    placeholder={COPY.requestIntegrationDescriptionPlaceholder}
                    value={customDescription}
                    onChange={(event) => setCustomDescription(event.target.value)}
                  />
                </label>
                <label className="grid gap-1.5 text-sm text-white">
                  <span className="font-medium">{COPY.requestIntegrationDocsUrlLabel}</span>
                  <input
                    data-testid="request-integration-custom-docs-url"
                    className={integrationWizardInputClassName}
                    placeholder={COPY.requestIntegrationDocsUrlPlaceholder}
                    value={customDocsUrl}
                    onChange={(event) => setCustomDocsUrl(event.target.value)}
                    autoComplete="off"
                  />
                </label>
              </div>
            )}

            <label className="mt-4 grid gap-1.5 text-sm text-white">
              <span className="font-medium">{COPY.requestIntegrationNotesLabel}</span>
              <textarea
                data-testid="request-integration-notes"
                className={textareaClassName}
                placeholder={COPY.requestIntegrationNotesPlaceholder}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </label>

            {error ? (
              <p
                className="mt-4 text-sm text-[var(--oh-color-danger)]"
                role="alert"
                data-testid="request-integration-error"
              >
                {error}
              </p>
            ) : null}
          </div>

          <div className={cn(modalFooterActionsClassName, "border-t border-[var(--oh-border)] px-7 py-4")}>
            {mode === "catalog" && selectedSlugs.length > 0 ? (
              <p
                data-testid="request-integration-selected-count"
                className="mr-auto text-xs text-[var(--color-text-muted)]"
              >
                {formatRequestIntegrationSelectedLabel(selectedSlugs.length)}
              </p>
            ) : null}
            <BrandButton
              type="button"
              variant="secondary"
              onClick={onClose}
              isDisabled={submitting}
            >
              {COPY.requestIntegrationCancel}
            </BrandButton>
            <BrandButton type="submit" variant="primary" isDisabled={submitting}>
              {submitting
                ? COPY.requestIntegrationSubmitting
                : mode === "catalog"
                  ? formatRequestIntegrationSubmitLabel(selectedSlugs.length)
                  : COPY.requestIntegrationSubmit}
            </BrandButton>
          </div>
        </form>
      </section>
    </ModalBackdrop>
  );
}
