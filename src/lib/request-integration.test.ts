import { describe, expect, it } from "vitest";

import type { IntegrationCatalogOption } from "@/src/types/integrations-hub";
import {
  buildCatalogRequestPayload,
  buildCustomRequestPayload,
  buildRequestableCatalogOptions,
  isValidOptionalHttpUrl,
  resolveSelectedCatalogEntries,
  slugFromIntegrationName,
  toggleSlugSelection,
} from "@/src/lib/request-integration";

const catalogEntry = (
  overrides: Partial<IntegrationCatalogOption> & Pick<IntegrationCatalogOption, "slug" | "name">,
): IntegrationCatalogOption => ({
  description: "",
  categories: [],
  notes: "",
  popularityRank: 10,
  connectionDefaults: {},
  ...overrides,
});

describe("slugFromIntegrationName", () => {
  it("normalizes display names into lowercase hyphenated slugs", () => {
    expect(slugFromIntegrationName(" Internal Wiki ")).toBe("internal-wiki");
    expect(slugFromIntegrationName("Acme CRM!")).toBe("acme-crm");
  });
});

describe("isValidOptionalHttpUrl", () => {
  it("allows blank values and http(s) URLs", () => {
    expect(isValidOptionalHttpUrl("")).toBe(true);
    expect(isValidOptionalHttpUrl("https://example.com/docs")).toBe(true);
    expect(isValidOptionalHttpUrl("not-a-url")).toBe(false);
  });
});

describe("buildRequestableCatalogOptions", () => {
  const catalog = [
    catalogEntry({
      slug: "github",
      name: "GitHub",
      description: "Source control",
      categories: ["Engineering"],
      popularityRank: 1,
    }),
    catalogEntry({
      slug: "linear",
      name: "Linear",
      description: "Issue tracking",
      categories: ["Project management"],
      popularityRank: 3,
    }),
    catalogEntry({
      slug: "notion",
      name: "Notion",
      description: "Workspace docs",
      categories: ["Knowledge base"],
      popularityRank: 2,
    }),
  ];

  it("excludes integrations already available in the catalog and sorts by popularity", () => {
    expect(
      buildRequestableCatalogOptions({
        catalog,
        availableSlugs: ["github"],
      }).map((entry) => entry.slug),
    ).toEqual(["notion", "linear"]);
  });

  it("filters remaining providers by search", () => {
    expect(
      buildRequestableCatalogOptions({
        catalog,
        availableSlugs: ["github"],
        search: "issue",
      }).map((entry) => entry.slug),
    ).toEqual(["linear"]);
  });
});

describe("toggleSlugSelection", () => {
  it("adds a slug that is not already selected and removes one that is", () => {
    expect(toggleSlugSelection(["linear"], "asana")).toEqual(["linear", "asana"]);
    expect(toggleSlugSelection(["linear", "asana"], "linear")).toEqual(["asana"]);
  });
});

describe("resolveSelectedCatalogEntries", () => {
  it("preserves selection order and skips unknown slugs", () => {
    expect(
      resolveSelectedCatalogEntries({
        catalog: [
          catalogEntry({ slug: "linear", name: "Linear" }),
          catalogEntry({ slug: "asana", name: "Asana" }),
        ],
        selectedSlugs: ["asana", "missing", "linear"],
      }).map((entry) => entry.slug),
    ).toEqual(["asana", "linear"]);
  });
});

describe("request payload builders", () => {
  it("copies catalog metadata into the admin request", () => {
    expect(
      buildCatalogRequestPayload({
        entry: catalogEntry({
          slug: "linear",
          name: "Linear",
          description: "Issue tracking",
          docsUrl: "https://linear.app/docs",
        }),
        notes: " Need this for planning. ",
      }),
    ).toEqual({
      source: "catalog",
      slug: "linear",
      name: "Linear",
      description: "Issue tracking",
      docsUrl: "https://linear.app/docs",
      notes: "Need this for planning.",
    });
  });

  it("builds a custom request with a generated slug", () => {
    expect(
      buildCustomRequestPayload({
        name: " Internal Wiki ",
        description: "Company knowledge base",
        docsUrl: "https://wiki.example.com",
        notes: "Read-only access",
      }),
    ).toEqual({
      source: "custom",
      slug: "internal-wiki",
      name: "Internal Wiki",
      description: "Company knowledge base",
      docsUrl: "https://wiki.example.com",
      notes: "Read-only access",
    });
  });
});
