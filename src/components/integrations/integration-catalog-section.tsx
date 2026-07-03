"use client";

import React from "react";

import { IntegrationCatalogCard } from "@/src/components/integrations/integration-catalog-card";
import { SectionCountBadge } from "@/src/components/integrations/section-count-badge";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { cn } from "@/src/lib/utils";
import {
  extensionModuleCardGridClassName,
  extensionModuleCardGridContainerClassName,
} from "@/src/styles/extension-module-card-classes";
import type { ManagedConnectorOption } from "@/src/types/integrations-hub";

interface IntegrationCatalogSectionProps {
  connectors: ManagedConnectorOption[];
  isPending?: boolean;
  errorMessage?: string | null;
  onConnect: (slug: string) => void;
}

const INITIAL_CONNECTOR_COUNT = 5;
const CONNECTOR_PAGE_SIZE = 5;

export function IntegrationCatalogSection({
  connectors,
  isPending = false,
  errorMessage = null,
  onConnect,
}: IntegrationCatalogSectionProps) {
  const [displayLimit, setDisplayLimit] = React.useState(INITIAL_CONNECTOR_COUNT);

  React.useEffect(() => {
    setDisplayLimit(INITIAL_CONNECTOR_COUNT);
  }, [connectors]);

  const displayedConnectors = connectors.slice(0, displayLimit);
  const canLoadMore = displayedConnectors.length < connectors.length;

  return (
    <section data-testid="integration-catalog-section">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold text-foreground">
          {INTEGRATIONS_PAGE_COPY.addIntegrationTitle}
        </h2>
        <SectionCountBadge count={connectors.length} />
        <span className="text-xs text-tertiary-light">
          {displayedConnectors.length} shown · {connectors.length} available
        </span>
      </div>
      <p className="mt-1 text-xs text-tertiary-light">
        {INTEGRATIONS_PAGE_COPY.cantFindPrompt}{" "}
        <a href="/admin-integrations" className="text-white underline-offset-4 hover:underline">
          {INTEGRATIONS_PAGE_COPY.cantFindLink}
        </a>
      </p>

      {isPending ? (
        <div
          data-testid="integration-catalog-loading"
          className="mt-3 rounded-xl border border-[var(--oh-border)] p-6 text-center"
        >
          <p className="text-xs text-tertiary-light">
            {INTEGRATIONS_PAGE_COPY.loadingCatalog}
          </p>
        </div>
      ) : errorMessage ? (
        <div
          data-testid="integration-catalog-error"
          className="mt-3 rounded-xl border border-[var(--oh-border)] p-6 text-center"
        >
          <p className="text-xs text-tertiary-light">{errorMessage}</p>
        </div>
      ) : connectors.length === 0 ? (
        <div
          data-testid="integration-catalog-empty"
          className="mt-3 rounded-xl border border-[var(--oh-border)] p-6 text-center"
        >
          <p className="text-xs text-tertiary-light">
            No popular integrations match the current search.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={cn("mt-3", extensionModuleCardGridContainerClassName)}>
            <div
              data-testid="integration-catalog-grid"
              className={extensionModuleCardGridClassName}
            >
              {displayedConnectors.map((connector) => (
                <IntegrationCatalogCard
                  key={connector.slug}
                  connector={connector}
                  onConnect={onConnect}
                />
              ))}
            </div>
          </div>
          {canLoadMore ? (
            <button
              type="button"
              className="w-full rounded-xl border border-[var(--oh-border)] bg-base-secondary px-4 py-2 text-sm text-white transition-colors hover:bg-[var(--oh-interactive-hover)]"
              onClick={() => setDisplayLimit((current) => current + CONNECTOR_PAGE_SIZE)}
            >
              Load more integrations
            </button>
          ) : null}
        </div>
      )}
    </section>
  );
}
