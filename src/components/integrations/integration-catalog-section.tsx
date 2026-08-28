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
  isAdmin?: boolean;
  onConnect: (slug: string) => void;
  onUseCustomMcp?: () => void;
}

export function IntegrationCatalogSection({
  connectors,
  isPending = false,
  errorMessage = null,
  isAdmin = false,
  onConnect,
  onUseCustomMcp,
}: IntegrationCatalogSectionProps) {
  return (
    <section data-testid="integration-catalog-section">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center">
          <h2 className="text-base font-semibold text-foreground">
            {INTEGRATIONS_PAGE_COPY.addIntegrationTitle}
          </h2>
          <SectionCountBadge count={connectors.length} />
        </div>
        {isAdmin && onUseCustomMcp ? (
          <button
            type="button"
            className="cursor-pointer text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)]"
            onClick={onUseCustomMcp}
          >
            {INTEGRATIONS_PAGE_COPY.wizardCustomMcpLabel}
          </button>
        ) : null}
      </div>

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
            {INTEGRATIONS_PAGE_COPY.searchEmpty}
          </p>
        </div>
      ) : (
        <div className={cn("mt-3", extensionModuleCardGridContainerClassName)}>
          <div
            data-testid="integration-catalog-grid"
            className={extensionModuleCardGridClassName}
          >
            {connectors.map((connector) => (
              <IntegrationCatalogCard
                key={connector.slug}
                connector={connector}
                onConnect={onConnect}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
