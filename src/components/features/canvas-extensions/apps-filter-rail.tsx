import React from "react";
import { useTranslation } from "react-i18next";
import { Puzzle, Server, SlidersHorizontal, Sparkles } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { useNavigation } from "#/context/navigation-context";
import { cn } from "#/utils/utils";
import {
  APP_CATEGORIES,
  APP_SORTS,
  LICENSE_GROUPS,
  PRICE_TIERS,
  type AppFilters,
  type facetCounts,
  type AppsView,
  type AppStatusFilter,
} from "#/utils/canvas-app-catalog";
import type { useAppsFilters } from "#/hooks/use-apps-filters";
import { licenseGroupKeys } from "./app-price-chips";

const sortKeys: Record<AppFilters["sort"], I18nKey> = {
  name: I18nKey.SETTINGS$APPS_SORT_NAME,
  enabled: I18nKey.SETTINGS$APPS_SORT_ENABLED,
  newest: I18nKey.SETTINGS$APPS_SORT_NEWEST,
  category: I18nKey.SETTINGS$APPS_CATEGORY,
  "price-asc": I18nKey.SETTINGS$APPS_SORT_PRICE_LOW,
  "price-desc": I18nKey.SETTINGS$APPS_SORT_PRICE_HIGH,
};
const categoryKeys: Record<(typeof APP_CATEGORIES)[number], I18nKey> = {
  games: I18nKey.SETTINGS$APPS_CATEGORY_GAMES,
  social: I18nKey.SETTINGS$APPS_CATEGORY_SOCIAL,
  docs: I18nKey.SETTINGS$APPS_CATEGORY_DOCS,
  project: I18nKey.SETTINGS$APPS_CATEGORY_PROJECT,
  learning: I18nKey.SETTINGS$APPS_CATEGORY_LEARNING,
  "dev-tools": I18nKey.SETTINGS$APPS_CATEGORY_DEV_TOOLS,
  other: I18nKey.SETTINGS$APPS_CATEGORY_OTHER,
};
const statusKeys: Record<AppStatusFilter, I18nKey> = {
  all: I18nKey.SETTINGS$APPS_STATUS_ALL,
  enabled: I18nKey.SETTINGS$SKILLS_ENABLED,
  disabled: I18nKey.SETTINGS$SKILLS_DISABLED,
  "not-installed": I18nKey.SETTINGS$APPS_STATUS_NOT_INSTALLED,
};
const priceKeys = {
  free: I18nKey.SETTINGS$APPS_PRICE_FREE,
  "one-time": I18nKey.SETTINGS$APPS_PRICE_ONE_TIME,
  subscription: I18nKey.SETTINGS$APPS_PRICE_SUBSCRIPTION,
  unknown: I18nKey.SETTINGS$APPS_PRICE_UNKNOWN,
} as const;

const MANAGE_LINKS = [
  {
    id: "skills",
    href: "/skills",
    label: I18nKey.SETTINGS$APPS_NAV_SKILLS,
    Icon: Sparkles,
  },
  {
    id: "plugins",
    href: "/plugins",
    label: I18nKey.SETTINGS$APPS_NAV_PLUGINS,
    Icon: Puzzle,
  },
  {
    id: "mcp",
    href: "/mcp",
    label: I18nKey.SETTINGS$APPS_NAV_MCP,
    Icon: Server,
  },
] as const;

const optionClassName =
  "flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1 text-sm text-contrast hover:bg-surface-raised has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:checked]:bg-surface-raised has-[:checked]:font-medium";

interface FacetProps<T extends string> {
  legend: string;
  name: string;
  value: T | null;
  options: { value: T | null; label: string; count?: number }[];
  onChange: (value: T | null) => void;
}

function Facet<T extends string>({
  legend,
  name,
  value,
  options,
  onChange,
}: FacetProps<T>) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-tertiary-light">
        {legend}
      </legend>
      {options.map((o) => (
        <label key={o.value ?? "all"} className={optionClassName}>
          <span className="flex min-w-0 items-center gap-2">
            <input
              type="radio"
              name={name}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="accent-primary"
            />
            <span className="truncate">{o.label}</span>
          </span>
          {o.count === undefined ? null : (
            <span className="text-xs text-tertiary-light">{o.count}</span>
          )}
        </label>
      ))}
    </fieldset>
  );
}

interface AppsFilterRailProps {
  state: ReturnType<typeof useAppsFilters>;
  counts: ReturnType<typeof facetCounts>;
}

export function AppsFilterRail({ state, counts }: AppsFilterRailProps) {
  const { t } = useTranslation("openhands");
  const { navigate, currentPath } = useNavigation();
  const [open, setOpen] = React.useState(false);
  const { view, filters } = state;
  const statuses: AppStatusFilter[] =
    view === "store"
      ? ["all", "enabled", "disabled", "not-installed"]
      : ["all", "enabled", "disabled"];

  const views: { id: AppsView; label: string }[] = [
    { id: "installed", label: t(I18nKey.SETTINGS$APPS_INSTALLED) },
    { id: "store", label: t(I18nKey.SETTINGS$APPS_STORE) },
  ];

  return (
    <aside
      data-testid="apps-filter-rail"
      aria-label={t(I18nKey.AUTOMATIONS$FILTERS)}
      className="flex w-full shrink-0 flex-col gap-3 md:sticky md:top-0 md:w-55 md:self-start"
    >
      <button
        type="button"
        data-testid="apps-filter-rail-toggle"
        aria-expanded={open}
        aria-controls="apps-filter-rail-panel"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-contrast md:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {t(I18nKey.AUTOMATIONS$FILTERS)}
      </button>

      <div
        id="apps-filter-rail-panel"
        className={cn("flex-col gap-4", open ? "flex" : "hidden md:flex")}
      >
        <div
          role="group"
          aria-label={t(I18nKey.SETTINGS$APPS_STORE)}
          className="flex gap-1 rounded-lg bg-base-secondary p-1"
        >
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              data-testid={`apps-view-${v.id}`}
              aria-pressed={view === v.id}
              onClick={() => state.setView(v.id)}
              className={cn(
                "flex-1 rounded-md px-2 py-1 text-sm text-contrast",
                view === v.id
                  ? "bg-surface-raised font-semibold"
                  : "hover:bg-surface-raised",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <input
          type="search"
          data-testid="apps-search"
          aria-label={t(I18nKey.SETTINGS$APPS_SEARCH_LABEL)}
          placeholder={t(I18nKey.SETTINGS$APPS_SEARCH_LABEL)}
          value={filters.query}
          onChange={(e) => state.setQuery(e.target.value)}
          className="w-full rounded-md border border-border bg-base-secondary px-2 py-1.5 text-sm text-contrast placeholder:text-tertiary-light"
        />

        <Facet
          legend={t(I18nKey.SETTINGS$APPS_SORT_LABEL)}
          name="apps-sort"
          value={filters.sort}
          options={APP_SORTS.map((s) => ({ value: s, label: t(sortKeys[s]) }))}
          onChange={(v) => v && state.setSort(v)}
        />
        <Facet
          legend={t(I18nKey.SETTINGS$APPS_FILTER_STATUS)}
          name="apps-status"
          value={filters.status}
          options={statuses.map((s) => ({
            value: s,
            label: t(statusKeys[s]),
            count: counts.status[s],
          }))}
          onChange={(v) => state.setStatus(v ?? "all")}
        />
        <Facet
          legend={t(I18nKey.SETTINGS$APPS_CATEGORY)}
          name="apps-category"
          value={filters.category}
          options={[
            { value: null, label: t(I18nKey.SETTINGS$APPS_STATUS_ALL) },
            ...APP_CATEGORIES.filter(
              (c) => counts.category[c] > 0 || filters.category === c,
            ).map((c) => ({
              value: c,
              label: t(categoryKeys[c]),
              count: counts.category[c],
            })),
          ]}
          onChange={state.setCategory}
        />
        <Facet
          legend={t(I18nKey.SETTINGS$APPS_PRICE)}
          name="apps-price"
          value={filters.price}
          options={[
            { value: null, label: t(I18nKey.SETTINGS$APPS_STATUS_ALL) },
            ...PRICE_TIERS.map((p) => ({
              value: p,
              label: t(priceKeys[p]),
              count: counts.price[p],
            })),
          ]}
          onChange={state.setPrice}
        />
        <Facet
          legend={t(I18nKey.SETTINGS$APPS_LICENSE)}
          name="apps-license"
          value={filters.license}
          options={[
            { value: null, label: t(I18nKey.SETTINGS$APPS_STATUS_ALL) },
            ...LICENSE_GROUPS.map((l) => ({
              value: l,
              label: t(licenseGroupKeys[l]),
              count: counts.license[l],
            })),
          ]}
          onChange={state.setLicense}
        />

        {state.hasActiveFilters ? (
          <button
            type="button"
            data-testid="apps-clear-filters"
            onClick={state.clear}
            className="self-start rounded-md px-2 py-1 text-sm text-primary underline"
          >
            {t(I18nKey.AUTOMATIONS$CLEAR_FILTERS)}
          </button>
        ) : null}

        <nav
          aria-label={t(I18nKey.SETTINGS$APPS_MANAGE)}
          className="mt-2 flex flex-col gap-0.5 border-t border-border pt-3"
        >
          <span className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-tertiary-light">
            {t(I18nKey.SETTINGS$APPS_MANAGE)}
          </span>
          {MANAGE_LINKS.map(({ id, href, label, Icon }) => {
            const active =
              currentPath === href || currentPath.startsWith(`${href}/`);
            return (
              <a
                key={id}
                href={href}
                data-testid={`apps-nav-${id}`}
                title={t(label)}
                aria-label={t(label)}
                aria-current={active ? "page" : undefined}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
                  e.preventDefault();
                  navigate(href);
                }}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-contrast hover:bg-surface-raised",
                  active && "bg-surface-raised font-semibold",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {t(label)}
              </a>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
