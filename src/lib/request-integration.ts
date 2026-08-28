import { matchesSearchQuery } from "@/src/lib/text-utils";
import type { IntegrationCatalogOption } from "@/src/types/integrations-hub";

export type IntegrationRequestSource = "catalog" | "custom";

export interface IntegrationRequestPayload {
  source: IntegrationRequestSource;
  slug?: string;
  name: string;
  description?: string;
  docsUrl?: string;
  notes?: string;
}

export function slugFromIntegrationName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidOptionalHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function buildRequestableCatalogOptions({
  catalog,
  availableSlugs,
  search = "",
}: {
  catalog: IntegrationCatalogOption[];
  availableSlugs: Iterable<string>;
  search?: string;
}): IntegrationCatalogOption[] {
  const available = new Set(
    [...availableSlugs].map((slug) => slug.trim().toLowerCase()).filter(Boolean),
  );

  return catalog
    .filter((entry) => !available.has(entry.slug.trim().toLowerCase()))
    .filter((entry) =>
      matchesSearchQuery(
        [entry.name, entry.slug, entry.description, ...entry.categories],
        search,
      ),
    )
    .sort((left, right) => {
      if (left.popularityRank !== right.popularityRank) {
        return left.popularityRank - right.popularityRank;
      }
      return left.name.localeCompare(right.name);
    });
}

export function toggleSlugSelection(selected: readonly string[], slug: string): string[] {
  return selected.includes(slug)
    ? selected.filter((item) => item !== slug)
    : [...selected, slug];
}

export function resolveSelectedCatalogEntries({
  catalog,
  selectedSlugs,
}: {
  catalog: IntegrationCatalogOption[];
  selectedSlugs: readonly string[];
}): IntegrationCatalogOption[] {
  const bySlug = new Map(catalog.map((entry) => [entry.slug, entry]));
  return selectedSlugs.flatMap((slug) => {
    const entry = bySlug.get(slug);
    return entry ? [entry] : [];
  });
}

export function buildCatalogRequestPayload({
  entry,
  notes,
}: {
  entry: IntegrationCatalogOption;
  notes: string;
}): IntegrationRequestPayload {
  return {
    source: "catalog",
    slug: entry.slug,
    name: entry.name,
    description: entry.description,
    docsUrl: entry.docsUrl ?? entry.appUrl,
    notes: notes.trim() || undefined,
  };
}

export function buildCustomRequestPayload({
  name,
  description,
  docsUrl,
  notes,
}: {
  name: string;
  description: string;
  docsUrl: string;
  notes: string;
}): IntegrationRequestPayload {
  const trimmedName = name.trim();
  return {
    source: "custom",
    slug: slugFromIntegrationName(trimmedName) || undefined,
    name: trimmedName,
    description: description.trim() || undefined,
    docsUrl: docsUrl.trim() || undefined,
    notes: notes.trim() || undefined,
  };
}
