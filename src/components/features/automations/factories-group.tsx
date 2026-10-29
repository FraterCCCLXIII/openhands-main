import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Plus } from "lucide-react";
import { FeedCustomIcon } from "#/components/features/feed/feed-custom-icon";
import { FeedIconTile } from "#/components/features/feed/feed-icon-tile";
import { NavigationLink } from "#/components/shared/navigation-link";
import { useBackendScopedPath } from "#/hooks/use-backend-scoped-path";
import { useFeedConversations } from "#/hooks/use-feed-conversations";
import { useFeedFactories } from "#/hooks/use-feed-factories";
import { useNavigation } from "#/context/navigation-context";
import { BrandButton } from "#/components/features/settings/brand-button";
import { AddFactoryModal } from "./factory/add-factory-modal";
import { I18nKey } from "#/i18n/declaration";
import { ExecutionStatus } from "#/types/agent-server/core";
import { factoryIconKey } from "#/utils/feed-icon-keys";
import { getFeedFactory } from "#/utils/feed-team-demo";
import {
  automationActivityListClassName,
  automationActivityRowClassName,
} from "./automation-view-mode";
import { StatusBadge } from "./status-badge";

/** Path of a factory's dashboard page. */
export const factoryPath = (factoryId: string, section = ""): string =>
  `/automations/factories/${factoryId}${section ? `/${section}` : ""}`;

interface FactoriesGroupProps {
  /** Narrows the rows to factories whose name or description match. */
  query?: string;
}

/** A row section on the Automate dashboard: each factory opens its own page. */
export function FactoriesGroup({ query = "" }: FactoriesGroupProps) {
  const { t } = useTranslation("openhands");
  const backendScopedPath = useBackendScopedPath();
  const { conversations } = useFeedConversations();
  const allFactories = useFeedFactories();
  const { navigate } = useNavigation();
  const [adding, setAdding] = useState(false);
  const needle = query.trim().toLowerCase();
  const factories = allFactories.filter(
    (factory) =>
      !needle ||
      `${factory.name} ${factory.description}`.toLowerCase().includes(needle),
  );
  // The section stays while a search matches nothing, so Add Factory is
  // always reachable; only the rows follow the search.
  return (
    <section data-testid="automation-factories">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center">
          <h2 className="text-base font-semibold text-foreground">
            {t(I18nKey.FEED$FACTORIES)}
          </h2>
          <StatusBadge count={factories.length} />
        </div>
        <BrandButton
          type="button"
          variant="secondary"
          testId="add-factory-button"
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5"
        >
          <Plus size={14} aria-hidden />
          {t(I18nKey.AUTOMATE$ADD_FACTORY)}
        </BrandButton>
      </div>
      <ul className={`${automationActivityListClassName} mt-3`}>
        {factories.map((factory) => {
          const own = conversations.filter(
            (c) => getFeedFactory(c.id).id === factory.id,
          );
          const live = own.filter(
            (c) => c.execution_status === ExecutionStatus.RUNNING,
          ).length;
          const { Icon } = factory;
          return (
            <li
              key={factory.id}
              data-testid={`automation-factory-${factory.id}`}
              className={automationActivityRowClassName}
            >
              <NavigationLink
                to={backendScopedPath(factoryPath(factory.id))}
                data-testid={`automation-factory-open-${factory.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
              >
                <span className="size-8 shrink-0">
                  <FeedCustomIcon
                    iconKey={factoryIconKey(factory.id)}
                    size={32}
                    radius={10}
                    glyph={<Icon size={16} />}
                    fallback={
                      <FeedIconTile className={factory.className}>
                        <Icon size={16} />
                      </FeedIconTile>
                    }
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium leading-5 text-foreground">
                    {factory.name}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {factory.description}
                  </span>
                </span>
                <span className="hidden shrink-0 items-center gap-3 text-xs text-muted sm:flex">
                  <span>
                    {t(I18nKey.FEED$FACTORY_CONVERSATIONS, {
                      count: own.length,
                    })}
                  </span>
                  <span className={live > 0 ? "text-success" : undefined}>
                    {t(I18nKey.FEED$FACTORY_LIVE, { count: live })}
                  </span>
                </span>
                <ChevronRight
                  size={16}
                  aria-hidden
                  className="shrink-0 text-muted"
                />
              </NavigationLink>
            </li>
          );
        })}
      </ul>
      {adding ? (
        <AddFactoryModal
          onClose={() => setAdding(false)}
          onCreated={(id) => {
            setAdding(false);
            navigate(backendScopedPath(factoryPath(id, "pipeline")));
          }}
        />
      ) : null}
    </section>
  );
}
