import { lookupModelPrice, type ModelPrice } from "#/constants/model-prices";

export type ModelPriceSort = "name" | "input" | "output";

/** Dollars for a per-1M-token or per-token amount, without trailing zeros. */
export function formatUsd(amount: number, maxFractionDigits?: number): string {
  const digits = maxFractionDigits ?? (amount < 1 ? 4 : 2);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(amount);
}

/** Per-1M-token price for display, e.g. `$3` or `$0.15`. */
export const formatPerMTok = (perMTok: number): string => formatUsd(perMTok);

/** The same price per single token, e.g. `$0.000003`. */
export const formatPerToken = (perMTok: number): string =>
  formatUsd(perMTok / 1_000_000, 10);

/**
 * Orders items by the price of their model, cheapest first. Models without a
 * price go last in their original order; "name" keeps the original order.
 */
export function sortByModelPrice<T>(
  items: readonly T[],
  getModel: (item: T) => string | null | undefined,
  sort: ModelPriceSort,
): T[] {
  if (sort === "name") {
    return [...items].sort((a, b) =>
      (getModel(a) ?? "").localeCompare(getModel(b) ?? ""),
    );
  }
  const priceOf = (item: T): number | null => {
    const price: ModelPrice | null = lookupModelPrice(getModel(item));
    if (!price) return null;
    return sort === "input" ? price.inputPerMTok : price.outputPerMTok;
  };
  return items
    .map((item, index) => ({ item, index, price: priceOf(item) }))
    .sort((a, b) => {
      if (a.price === null && b.price === null) return a.index - b.index;
      if (a.price === null) return 1;
      if (b.price === null) return -1;
      return a.price - b.price || a.index - b.index;
    })
    .map(({ item }) => item);
}
