import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp, LayoutGrid } from "lucide-react";
import { FeedCustomIcon } from "#/components/features/feed/feed-custom-icon";
import { FeedIconTile } from "#/components/features/feed/feed-icon-tile";
import { usePaginatedConversations } from "#/hooks/query/use-paginated-conversations";
import { useFeedFactories } from "#/hooks/use-feed-factories";
import { I18nKey } from "#/i18n/declaration";
import { useSidebarFactoryStore } from "#/stores/sidebar-factory-store";
import { factoryIconKey } from "#/utils/feed-icon-keys";
import { getFeedFactory } from "#/utils/feed-team-demo";
import { ExecutionStatus } from "#/types/agent-server/core/base/common";
import { cn } from "#/utils/utils";

const COLLAPSED_ROWS = 4;

interface RowProps {
  testId: string;
  label: string;
  count: number;
  live: boolean;
  selected: boolean;
  icon: React.ReactNode;
  onSelect: () => void;
}

function FactoryRow({
  testId,
  label,
  count,
  live,
  selected,
  icon,
  onSelect,
}: RowProps) {
  return (
    <li>
      <button
        type="button"
        data-testid={testId}
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm",
          selected
            ? "bg-surface-raised font-medium text-contrast"
            : "text-muted hover:bg-surface-raised hover:text-contrast",
        )}
      >
        <span className="flex size-7 shrink-0 items-center justify-center">
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {live ? (
          <span
            data-testid="sidebar-factory-live"
            aria-hidden="true"
            className="size-1.5 shrink-0 rounded-full bg-success"
          />
        ) : null}
        <span className="shrink-0 text-xs tabular-nums text-muted">
          {count}
        </span>
      </button>
    </li>
  );
}

/**
 * The factories at the top of the left nav, as a list like the Feed's. Picking one narrows the
 * conversations list below it to that factory's agents; "All" clears the filter.
 */
export function SidebarFactories() {
  const { t } = useTranslation("openhands");
  const factories = useFeedFactories();
  const { data } = usePaginatedConversations();
  const factoryId = useSidebarFactoryStore((s) => s.factoryId);
  const expanded = useSidebarFactoryStore((s) => s.expanded);
  const selectFactory = useSidebarFactoryStore((s) => s.selectFactory);
  const setExpanded = useSidebarFactoryStore((s) => s.setExpanded);

  const stats = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.items) ?? [];
    const byFactory = new Map<string, { count: number; live: boolean }>();
    all.forEach((c) => {
      const id = getFeedFactory(c.id).id;
      const cur = byFactory.get(id) ?? { count: 0, live: false };
      byFactory.set(id, {
        count: cur.count + 1,
        live: cur.live || c.execution_status === ExecutionStatus.RUNNING,
      });
    });
    return {
      total: all.length,
      byFactory,
      anyLive: all.some((c) => c.execution_status === ExecutionStatus.RUNNING),
    };
  }, [data]);

  const rows = expanded ? factories : factories.slice(0, COLLAPSED_ROWS);
  const hidden = factories.length - COLLAPSED_ROWS;

  return (
    <section
      data-testid="sidebar-factories"
      className="flex flex-col gap-1 px-2 pb-2 pt-1"
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
          {t(I18nKey.FEED$FACTORIES)}
        </h2>
        {hidden > 0 ? (
          <button
            type="button"
            data-testid="sidebar-factories-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-xs text-muted hover:text-contrast"
          >
            {t(
              expanded
                ? I18nKey.FEED$DETAILS_SHOW_LESS
                : I18nKey.FEED$DETAILS_SHOW_MORE,
            )}
            {expanded ? (
              <ChevronUp size={12} aria-hidden />
            ) : (
              <ChevronDown size={12} aria-hidden />
            )}
          </button>
        ) : null}
      </div>
      <ul
        className={cn(
          "custom-scrollbar flex flex-col gap-0.5 overflow-y-auto",
          expanded ? "max-h-72" : "max-h-48",
        )}
      >
        <FactoryRow
          testId="sidebar-factory-all"
          label={t(I18nKey.FEED$ALL)}
          count={stats.total}
          live={stats.anyLive}
          selected={factoryId === null}
          icon={<LayoutGrid size={16} aria-hidden />}
          onSelect={() => selectFactory(null)}
        />
        {rows.map(({ id, name, Icon, className }) => (
          <FactoryRow
            key={id}
            testId="sidebar-factory"
            label={name}
            count={stats.byFactory.get(id)?.count ?? 0}
            live={stats.byFactory.get(id)?.live ?? false}
            selected={factoryId === id}
            icon={
              <FeedCustomIcon
                iconKey={factoryIconKey(id)}
                size={28}
                radius={9}
                glyph={<Icon size={16} />}
                fallback={
                  <FeedIconTile className={className}>
                    <Icon size={16} />
                  </FeedIconTile>
                }
              />
            }
            onSelect={() => selectFactory(factoryId === id ? null : id)}
          />
        ))}
      </ul>
    </section>
  );
}
