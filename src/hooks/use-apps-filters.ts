import { useSearchParams } from "react-router";
import {
  APP_CATEGORIES,
  APP_SORTS,
  LICENSE_GROUPS,
  PRICE_TIERS,
  type LicenseGroup,
  type PriceTier,
  type AppCategory,
  type AppFilters,
  type AppsView,
  type AppStatusFilter,
} from "#/utils/canvas-app-catalog";

const STATUSES: readonly AppStatusFilter[] = [
  "all",
  "enabled",
  "disabled",
  "not-installed",
];

/**
 * The Apps page view, sort and filters, read from the URL so they are
 * shareable and survive reload. Defaults are omitted from the URL.
 */
export function useAppsFilters() {
  const [params, setParams] = useSearchParams();
  const view: AppsView = params.get("view") === "store" ? "store" : "installed";
  const rawStatus = STATUSES.find((s) => s === params.get("status")) ?? "all";
  const filters: AppFilters = {
    sort: APP_SORTS.find((s) => s === params.get("sort")) ?? "name",
    // "Not installed" only exists in the App Store.
    status:
      view === "installed" && rawStatus === "not-installed" ? "all" : rawStatus,
    category: APP_CATEGORIES.find((c) => c === params.get("category")) ?? null,
    price: PRICE_TIERS.find((p) => p === params.get("price")) ?? null,
    license: LICENSE_GROUPS.find((l) => l === params.get("license")) ?? null,
    query: params.get("q") ?? "",
  };

  const update = (changes: Record<string, string | null>, replace = false) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        Object.entries(changes).forEach(([key, value]) => {
          const isDefault =
            value === null ||
            value === "" ||
            (key === "sort" && value === "name") ||
            (key === "status" && value === "all") ||
            (key === "view" && value === "installed");
          if (isDefault) next.delete(key);
          else next.set(key, value);
        });
        return next;
      },
      { replace },
    );

  return {
    view,
    filters,
    setView: (next: AppsView) => update({ view: next }),
    setSort: (sort: AppFilters["sort"]) => update({ sort }, true),
    setStatus: (status: AppStatusFilter) => update({ status }, true),
    setCategory: (category: AppCategory | null) => update({ category }, true),
    setPrice: (price: PriceTier | null) => update({ price }, true),
    setLicense: (license: LicenseGroup | null) => update({ license }, true),
    setQuery: (q: string) => update({ q }, true),
    clear: () =>
      update(
        {
          sort: null,
          status: null,
          category: null,
          price: null,
          license: null,
          q: null,
        },
        true,
      ),
    hasActiveFilters:
      filters.status !== "all" ||
      !!filters.category ||
      !!filters.price ||
      !!filters.license ||
      !!filters.query,
  };
}
