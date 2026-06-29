"use client";

import { CirclePlusCheckToggle } from "@/src/components/shared/buttons/circle-plus-check-toggle";
import { IntegrationLogoBadge } from "@/src/components/integrations/integration-logo-badge";
import {
  getAuthTypeLabel,
  INTEGRATIONS_PAGE_COPY,
} from "@/src/constants/integrations-page";
import { cn } from "@/src/lib/utils";
import {
  extensionModuleCardInteractiveClassName,
  extensionModuleCardPillClassName,
  extensionModuleCardSurfaceClassName,
} from "@/src/styles/extension-module-card-classes";
import type { ManagedConnectorOption } from "@/src/types/integrations-hub";

interface IntegrationCatalogCardProps {
  connector: ManagedConnectorOption;
  onConnect: (slug: string) => void;
}

export function IntegrationCatalogCard({
  connector,
  onConnect,
}: IntegrationCatalogCardProps) {
  const authLabel = getAuthTypeLabel(connector.authStrategy);

  return (
    <article
      data-managed-connector-slug={connector.slug}
      data-testid={`integration-catalog-card-${connector.slug}`}
      onClick={() => onConnect(connector.slug)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onConnect(connector.slug);
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "flex min-h-[132px] min-w-0 cursor-pointer flex-col overflow-hidden p-4 text-left",
        extensionModuleCardSurfaceClassName,
        extensionModuleCardInteractiveClassName,
      )}
    >
      <div className="flex items-start gap-3">
        <IntegrationLogoBadge
          slug={connector.slug}
          name={connector.name}
          logoUrl={connector.logoUrl}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <header className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-white">
                {connector.name}
              </h3>
              <p className="mt-0.5 text-xs text-tertiary-alt">{authLabel}</p>
            </div>
            <CirclePlusCheckToggle
              testId={`integration-catalog-toggle-${connector.slug}`}
              isSelected={false}
              onToggle={(selected) => {
                if (selected) {
                  onConnect(connector.slug);
                }
              }}
              enableLabel={INTEGRATIONS_PAGE_COPY.catalogAddLabel}
              disableLabel={INTEGRATIONS_PAGE_COPY.catalogAddLabel}
              enableTooltip={INTEGRATIONS_PAGE_COPY.catalogAddTooltip}
              removeTooltip={INTEGRATIONS_PAGE_COPY.catalogRemoveTooltip}
            />
          </header>
          <p className="line-clamp-3 text-xs leading-relaxed text-tertiary-light">
            {connector.description}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={extensionModuleCardPillClassName}>
              {connector.toolCount} tools
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
