import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { AddFactoryModal } from "#/components/features/automations/factory/add-factory-modal";
import { BrandButton } from "#/components/features/settings/brand-button";
import { FeedCustomIcon } from "#/components/features/feed/feed-custom-icon";
import { FeedIconTile } from "#/components/features/feed/feed-icon-tile";
import { useNavigation } from "#/context/navigation-context";
import { usePaginatedConversations } from "#/hooks/query/use-paginated-conversations";
import {
  useFactoryResolver,
  useFeedFactories,
} from "#/hooks/use-feed-factories";
import { I18nKey } from "#/i18n/declaration";
import { ExecutionStatus } from "#/types/agent-server/core/base/common";
import { factoryIconKey } from "#/utils/feed-icon-keys";
import { settingsLikeMainScrollClassName } from "#/utils/settings-like-page-layout-classes";
import { cn } from "#/utils/utils";

const NEW_FACTORY_PARAM = "new";

/** Every factory as a tile: how many agents work in it and how many are running now. */
export default function FactoryScreen() {
  const { t } = useTranslation("openhands");
  const { navigate } = useNavigation();
  const factories = useFeedFactories();
  const resolveFactory = useFactoryResolver();
  const { data } = usePaginatedConversations();
  const [searchParams, setSearchParams] = useSearchParams();
  const [adding, setAdding] = useState(false);

  // `/factory?new=1` is the New Chat menu's "New factory" link: open the modal
  // once, then drop the param so a reload or Back does not reopen it.
  const wantsNewFactory = searchParams.get(NEW_FACTORY_PARAM) === "1";
  useEffect(() => {
    if (!wantsNewFactory) return;
    setAdding(true);
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete(NEW_FACTORY_PARAM);
        return next;
      },
      { replace: true },
    );
  }, [wantsNewFactory, setSearchParams]);

  const all = data?.pages.flatMap((page) => page.items) ?? [];
  const stats = (id: string) => {
    const mine = all.filter((c) => resolveFactory(c)?.id === id);
    return {
      count: mine.length,
      live: mine.filter((c) => c.execution_status === ExecutionStatus.RUNNING)
        .length,
    };
  };

  return (
    <div data-testid="factory-screen" className="flex h-full">
      <main className={cn(settingsLikeMainScrollClassName, "h-full")}>
        <div className="mx-auto flex w-full max-w-200 flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <h2 className="text-xl font-semibold leading-6 tracking-tight text-foreground">
                {t(I18nKey.NAV$FACTORY)}
              </h2>
              <p className="max-w-2xl text-sm leading-5 text-tertiary-light">
                {t(I18nKey.NAV$FACTORY_DESCRIPTION)}
              </p>
            </div>
            <BrandButton
              type="button"
              variant="primary"
              testId="factory-new-button"
              className="shrink-0 whitespace-nowrap"
              onClick={() => setAdding(true)}
            >
              <Plus size={14} aria-hidden className="mr-1.5" />
              {t(I18nKey.AUTOMATE$ADD_FACTORY)}
            </BrandButton>
          </div>
          <ul className="flex flex-col gap-3">
            {factories.map((factory) => {
              const { count, live } = stats(factory.id);
              return (
                <li key={factory.id}>
                  <button
                    type="button"
                    data-testid={`factory-tile-${factory.id}`}
                    onClick={() =>
                      navigate(`/automations/factories/${factory.id}`)
                    }
                    className="flex w-full items-center gap-3 rounded-2xl bg-base-secondary p-4 text-left ring-1 ring-white/5 transition-colors hover:ring-white/15"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center">
                      <FeedCustomIcon
                        iconKey={factoryIconKey(factory.id)}
                        size={40}
                        radius={12}
                        glyph={<factory.Icon size={20} />}
                        fallback={
                          <FeedIconTile className={factory.className}>
                            <factory.Icon size={20} />
                          </FeedIconTile>
                        }
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-contrast">
                        {factory.name}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {factory.description}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end text-xs tabular-nums text-muted">
                      <span>{count}</span>
                      {live ? (
                        <span className="flex items-center gap-1 text-success">
                          <span className="size-1.5 rounded-full bg-success" />
                          {live}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </main>
      {adding ? (
        <AddFactoryModal
          onClose={() => setAdding(false)}
          onCreated={() => setAdding(false)}
        />
      ) : null}
    </div>
  );
}
