import type { InstalledCanvasExtensionInfo } from "#/types/canvas-extension";

export const APP_CATEGORIES = [
  "games",
  "social",
  "docs",
  "project",
  "learning",
  "dev-tools",
  "other",
] as const;
export type AppCategory = (typeof APP_CATEGORIES)[number];

export type AppsView = "installed" | "store";
export type AppSort =
  | "name"
  | "enabled"
  | "newest"
  | "category"
  | "price-asc"
  | "price-desc";
export type AppStatus = "enabled" | "disabled" | "not-installed";
export type AppStatusFilter = "all" | AppStatus;

export const APP_SORTS: readonly AppSort[] = [
  "name",
  "enabled",
  "newest",
  "category",
  "price-asc",
  "price-desc",
];

export type PriceModel = "free" | "one-time" | "subscription";
export type PriceTier = PriceModel | "unknown";
export const PRICE_TIERS: readonly PriceTier[] = [
  "free",
  "one-time",
  "subscription",
  "unknown",
];

export type LicenseGroup =
  | "open-source"
  | "proprietary"
  | "other"
  | "unspecified";
export const LICENSE_GROUPS: readonly LicenseGroup[] = [
  "open-source",
  "proprietary",
  "other",
  "unspecified",
];

/**
 * Optional listing price (USD). Display metadata only: Canvas processes no
 * payments. `sample` marks demo data that is not a real offer.
 */
export interface AppPricing {
  model: PriceModel;
  amount?: number;
  period?: "month" | "year";
  sample?: boolean;
}

const OPEN_SOURCE_LICENSES =
  /^(MIT|ISC|Unlicense|0BSD|Zlib|CC0-1\.0|Apache-2\.0|BSD-[23]-Clause|MPL-2\.0|(A|L)?GPL-[23]\.0(-only|-or-later)?)$/i;
const PROPRIETARY_LICENSES = /^(proprietary|commercial|LicenseRef-.*)$/i;

export const licenseGroupOf = (license: string | null): LicenseGroup => {
  if (!license?.trim()) return "unspecified";
  const id = license.trim();
  if (OPEN_SOURCE_LICENSES.test(id)) return "open-source";
  if (PROPRIETARY_LICENSES.test(id)) return "proprietary";
  return "other";
};

export const priceTierOf = (pricing: AppPricing | null): PriceTier =>
  pricing?.model ?? "unknown";

/** Comparable price: free is 0, a yearly plan is per month, unknown is null. */
export const priceValueOf = (pricing: AppPricing | null): number | null => {
  if (!pricing) return null;
  if (pricing.model === "free") return 0;
  if (typeof pricing.amount !== "number") return null;
  return pricing.period === "year" ? pricing.amount / 12 : pricing.amount;
};

const parsePricing = (value: unknown): AppPricing | null => {
  const v = value as Partial<AppPricing> | null | undefined;
  if (!v || !["free", "one-time", "subscription"].includes(v.model ?? ""))
    return null;
  return v as AppPricing;
};

/** An entry of `public/known-apps.json` that Canvas can install. */
export interface KnownApp {
  name: string;
  display_name?: string;
  kind: string;
  version?: string;
  description?: string;
  category?: string;
  /** SPDX identifier (or name) of the app's licence. */
  license?: string;
  pricing?: AppPricing;
  /** A real publisher contact URL; the paid-app "Contact" link needs one. */
  contact_url?: string;
  source?: string;
  ref?: string;
  repo?: string;
  path?: string;
}

/** One row of the Installed or App Store grid. */
export interface AppEntry {
  name: string;
  label: string;
  description: string;
  status: AppStatus;
  category: AppCategory;
  installedAt: number;
  pricing: AppPricing | null;
  license: string | null;
  contactUrl: string | null;
  installed: InstalledCanvasExtensionInfo | null;
  known: KnownApp | null;
}

export interface AppFilters {
  sort: AppSort;
  status: AppStatusFilter;
  category: AppCategory | null;
  price: PriceTier | null;
  license: LicenseGroup | null;
  query: string;
}

const INSTALLABLE_KINDS = new Set(["canvas-app", "canvas-app-fixture"]);

export const isInstallableKnownApp = (app: KnownApp) =>
  INSTALLABLE_KINDS.has(app.kind);

export const toCategory = (value: string | null | undefined): AppCategory =>
  APP_CATEGORIES.find((c) => c === value) ?? "other";

export const parseKnownApps = (json: unknown): KnownApp[] => {
  const apps = (json as { apps?: unknown } | null)?.apps;
  if (!Array.isArray(apps)) return [];
  return apps.filter(
    (a): a is KnownApp =>
      !!a && typeof a.name === "string" && typeof a.kind === "string",
  );
};

export const installRequestFor = (app: KnownApp) => ({
  source: app.source ?? `github:${app.repo ?? ""}`,
  ref: app.ref ?? null,
  repo_path: app.path ?? null,
});

const statusOf = (e: InstalledCanvasExtensionInfo): AppStatus =>
  e.enabled ? "enabled" : "disabled";

export function buildEntries(
  view: AppsView,
  installed: InstalledCanvasExtensionInfo[],
  known: KnownApp[],
): AppEntry[] {
  const knownByName = new Map(known.map((k) => [k.name, k]));
  const fromInstalled = (e: InstalledCanvasExtensionInfo): AppEntry => {
    const k = knownByName.get(e.name) ?? null;
    return {
      name: e.name,
      pricing: parsePricing(e.manifest?.pricing ?? k?.pricing),
      license: e.manifest?.license || k?.license || null,
      contactUrl: k?.contact_url ?? null,
      label: e.manifest?.display_name || e.name,
      description: e.description || e.manifest?.description || "",
      status: statusOf(e),
      category: toCategory(k?.category),
      installedAt: Date.parse(e.installed_at) || 0,
      installed: e,
      known: k,
    };
  };
  if (view === "installed") return installed.map(fromInstalled);
  const installedByName = new Map(installed.map((e) => [e.name, e]));
  return known.filter(isInstallableKnownApp).map((k) => {
    const e = installedByName.get(k.name);
    return {
      name: k.name,
      pricing: parsePricing(e?.manifest?.pricing ?? k.pricing),
      license: e?.manifest?.license || k.license || null,
      contactUrl: k.contact_url ?? null,
      label: k.display_name || k.name,
      description: k.description ?? "",
      status: e ? statusOf(e) : "not-installed",
      category: toCategory(k.category),
      installedAt: e ? Date.parse(e.installed_at) || 0 : 0,
      installed: e ?? null,
      known: k,
    };
  });
}

/** Display names carry a trademark sign; search and sorting compare without it. */
export const stripTrademark = (text: string) => text.replace(/™/g, "");

const matchesQuery = (e: AppEntry, query: string) => {
  const q = stripTrademark(query).trim().toLowerCase();
  return (
    !q ||
    stripTrademark(e.label).toLowerCase().includes(q) ||
    e.name.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q)
  );
};

const facetPredicates = (f: AppFilters) => ({
  status: (e: AppEntry) => f.status === "all" || e.status === f.status,
  category: (e: AppEntry) => !f.category || e.category === f.category,
  price: (e: AppEntry) => !f.price || priceTierOf(e.pricing) === f.price,
  license: (e: AppEntry) =>
    !f.license || licenseGroupOf(e.license) === f.license,
});

/** Each facet ignores its own selection so its counts stay meaningful. */
export function facetCounts(entries: AppEntry[], f: AppFilters) {
  const preds = facetPredicates(f);
  const searched = entries.filter((e) => matchesQuery(e, f.query));
  const others = (skip: keyof typeof preds) =>
    searched.filter((e) =>
      (Object.keys(preds) as (keyof typeof preds)[])
        .filter((k) => k !== skip)
        .every((k) => preds[k](e)),
    );
  const status: Record<AppStatusFilter, number> = {
    all: 0,
    enabled: 0,
    disabled: 0,
    "not-installed": 0,
  };
  others("status").forEach((e) => {
    status.all += 1;
    status[e.status] += 1;
  });
  const category = Object.fromEntries(
    APP_CATEGORIES.map((c) => [c, 0]),
  ) as Record<AppCategory, number>;
  others("category").forEach((e) => {
    category[e.category] += 1;
  });
  const price = { free: 0, "one-time": 0, subscription: 0, unknown: 0 };
  others("price").forEach((e) => {
    price[priceTierOf(e.pricing)] += 1;
  });
  const license = {
    "open-source": 0,
    proprietary: 0,
    other: 0,
    unspecified: 0,
  };
  others("license").forEach((e) => {
    license[licenseGroupOf(e.license)] += 1;
  });
  return { status, category, price, license };
}

export function applyFilters(entries: AppEntry[], f: AppFilters): AppEntry[] {
  const preds = facetPredicates(f);
  const rank = (e: AppEntry) => APP_CATEGORIES.indexOf(e.category);
  return entries
    .filter(
      (e) =>
        matchesQuery(e, f.query) &&
        Object.values(preds).every((pred) => pred(e)),
    )
    .sort((a, b) => {
      if (f.sort === "enabled") {
        const diff =
          Number(b.status === "enabled") - Number(a.status === "enabled");
        if (diff) return diff;
      }
      if (f.sort === "newest" && b.installedAt !== a.installedAt)
        return b.installedAt - a.installedAt;
      if (f.sort === "category" && rank(a) !== rank(b))
        return rank(a) - rank(b);
      if (f.sort === "price-asc" || f.sort === "price-desc") {
        const pa = priceValueOf(a.pricing);
        const pb = priceValueOf(b.pricing);
        // Unknown prices sort last in both directions.
        if (pa === null && pb !== null) return 1;
        if (pb === null && pa !== null) return -1;
        if (pa !== null && pb !== null && pa !== pb)
          return f.sort === "price-asc" ? pa - pb : pb - pa;
      }
      return stripTrademark(a.label).localeCompare(stripTrademark(b.label));
    });
}
