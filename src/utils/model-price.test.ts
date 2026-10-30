import { describe, expect, it } from "vitest";
import { lookupModelPrice } from "#/constants/model-prices";
import { formatPerMTok, sortByModelPrice } from "./model-price";

describe("lookupModelPrice", () => {
  it("resolves provider-prefixed ids to the same price as the bare id", () => {
    const bare = lookupModelPrice("claude-sonnet-5-5");

    expect(bare).toMatchObject({ inputPerMTok: 2, outputPerMTok: 10 });
    expect(lookupModelPrice("openhands/claude-sonnet-5-5")).toBe(bare);
    expect(lookupModelPrice("litellm_proxy/anthropic/claude-sonnet-5-5")).toBe(
      bare,
    );
  });

  it("resolves a dated id only through an explicit alias", () => {
    expect(lookupModelPrice("claude-sonnet-4-5-20250929")).toBe(
      lookupModelPrice("claude-sonnet-4-5"),
    );
    expect(lookupModelPrice("claude-sonnet-4-5-20990101")).toBeNull();
  });

  it("returns null for models absent from the matrix", () => {
    expect(lookupModelPrice("openhands/not-a-real-model")).toBeNull();
    expect(lookupModelPrice(null)).toBeNull();
  });
});

describe("sortByModelPrice", () => {
  const models = [
    "openhands/claude-fable-5-1",
    "openhands/unpriced-model",
    "openhands/claude-haiku-5-5",
    "openhands/claude-sonnet-5-5",
  ];
  const sort = (by: "name" | "input" | "output") =>
    sortByModelPrice(models, (m) => m, by);

  it("orders cheapest first and puts unknown prices last", () => {
    expect(sort("input")).toEqual([
      "openhands/claude-haiku-5-5",
      "openhands/claude-sonnet-5-5",
      "openhands/claude-fable-5-1",
      "openhands/unpriced-model",
    ]);
    expect(sort("output").at(-1)).toBe("openhands/unpriced-model");
  });

  it("orders by name alphabetically", () => {
    expect(sort("name")[0]).toBe("openhands/claude-fable-5-1");
  });
});

describe("formatPerMTok", () => {
  it("drops trailing zeros and keeps sub-dollar precision", () => {
    expect(formatPerMTok(3)).toBe("$3");
    expect(formatPerMTok(0.15)).toBe("$0.15");
  });
});
