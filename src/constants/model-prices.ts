/**
 * Model price matrix: list prices in USD per 1M tokens, the single source for
 * every price shown in the UI. Do not copy it into extension apps.
 *
 * Sources, highest priority first (a model id appears once, in the first source
 * that has it):
 * 1. kosmos-engine `tools/pm/prices.json` (asOf 2026-10-24) — the matrix the
 *    Projects hub Costs view and the Runner (run-timeline) app price with.
 * 2. LiteLLM `model_prices_and_context_window.json`, fetched 2026-10-29 into
 *    `examples/canvas-apps/run-timeline/extension.js` by `update-prices.mjs`
 *    (first-party chat models only; moving `*-latest` aliases are left out).
 * 3. The bundled fallback catalog of `examples/canvas-apps/usage-insights`.
 *
 * Known difference: claude-sonnet-5-5 cached input is 0.2 in (1) and 0.1 in
 * (2); (1) wins. These are list prices and may differ from a provider bill.
 */
/** Short source names for the price legend shown under the model list. */
export const MODEL_PRICES_LEGEND_SOURCE = "kosmos-engine prices.json, LiteLLM";

export interface ModelPrice {
  modelId: string;
  inputPerMTok: number;
  outputPerMTok: number;
  cachedPerMTok?: number;
  source: string;
  asOf: string;
}

type PriceRow = readonly [
  id: string,
  input: number,
  output: number,
  cached: number | null,
];

const KOSMOS_SOURCE = "kosmos-engine prices.json (Projects hub, Runner)";
const KOSMOS_AS_OF = "2026-10-24";
const LITELLM_SOURCE = "LiteLLM price list (Runner)";
const LITELLM_AS_OF = "2026-10-29";
const USAGE_INSIGHTS_SOURCE = "Usage insights bundled prices";
const USAGE_INSIGHTS_AS_OF = "2026-10-29";

const KOSMOS_ROWS: readonly PriceRow[] = [
  ["claude-fable-5-1", 10, 50, 0.25],
  ["claude-opus-5-5", 4, 20, 0.2],
  ["claude-sonnet-5-5", 2, 10, 0.2],
  ["claude-haiku-5-5", 0.1, 0.5, 0.01],
  ["gpt-5-5", 5, 30, 0.5],
  ["gemini-3-1-pro", 2, 12, 0.2],
  ["gemini-2-5-flash", 0.3, 2.5, 0.03],
];

const LITELLM_ROWS: readonly PriceRow[] = [
  ["claude-fable-5", 10, 50, 1],
  ["claude-fable-5-1", 10, 50, 0.25],
  ["claude-haiku-4-5", 1, 5, 0.1],
  ["claude-haiku-5-5", 0.1, 0.5, 0.01],
  ["claude-mythos-5", 10, 50, 1],
  ["claude-mythos-5-1", 10, 50, 0.25],
  ["claude-opus-4-5", 5, 25, 0.5],
  ["claude-opus-4-6", 5, 25, 0.5],
  ["claude-opus-4-7", 5, 25, 0.5],
  ["claude-opus-4-8", 5, 25, 0.5],
  ["claude-opus-5", 5, 25, 0.5],
  ["claude-opus-5-5", 4, 20, 0.2],
  ["claude-sonnet-4-5", 3, 15, 0.3],
  ["claude-sonnet-4-6", 3, 15, 0.3],
  ["claude-sonnet-5", 2, 10, 0.2],
  ["claude-sonnet-5-5", 2, 10, 0.1],
  ["deepseek-coder", 0.14, 0.28, 0.014],
  ["deepseek-flash", 0.3, 1.2, 0.006],
  ["deepseek-r1", 0.55, 2.19, 0.14],
  ["deepseek-v3", 0.27, 1.1, 0.07],
  ["deepseek-v3.2", 0.28, 0.4, 0.028],
  ["deepseek-v4-flash", 0.3, 1.2, 0.006],
  ["deepseek-v4-flash-vision-exp", 0.3, 1.2, 0.006],
  ["deepseek-v4-pro", 1.32, 3.96, 0.044],
  ["deep-research-max-preview-04-2026", 2, 12, null],
  ["gemini-2.5-flash", 0.3, 2.5, 0.03],
  ["gemini-2.5-flash-lite", 0.1, 0.4, 0.01],
  ["gemini-2.5-pro", 1.25, 10, 0.125],
  ["gemini-3-flash-preview", 0.5, 3, 0.05],
  ["gemini-3.1-flash-lite", 0.25, 1.5, 0.025],
  ["gemini-3.1-pro-preview", 2, 12, 0.2],
  ["gemini-3.1-pro-preview-customtools", 2, 12, 0.2],
  ["gemini-3.5-flash", 1.5, 9, 0.15],
  ["gemini-3.5-flash-lite", 0.3, 2.5, 0.03],
  ["gemini-3.6-flash", 0.75, 3.75, 0.075],
  ["gemini-3.7-flash", 0.75, 3.75, 0.075],
  ["gemini-3.8-flash", 0.75, 3.75, 0.075],
  ["gemini-4-argon", 2, 10, 0.1],
  ["gemini-exp-1114", 0, 0, null],
  ["gemini-exp-1206", 0, 0, null],
  ["gemini-gemma-2-27b-it", 0.35, 1.05, null],
  ["gemini-gemma-2-9b-it", 0.35, 1.05, null],
  ["gemini-omni-1.1-flash", 1.5, 9, null],
  ["gemma-3-27b-it", 0, 0, null],
  ["gemma-4-26b-a4b-it", 0, 0, null],
  ["gemma-4-31b-it", 0, 0, null],
  ["learnlm-1.5-pro-experimental", 0, 0, null],
  ["lyria-3-clip-preview", 0, 0, null],
  ["lyria-3-pro-preview", 0, 0, null],
  ["lyria-3.5", 0, 0, null],
  ["lyria-3.5-clip-preview", 0, 0, null],
  ["lyria-3.5-pro-preview", 0, 0, null],
  ["codestral-2508", 0.3, 0.9, 0.03],
  ["deepseek-v4-1-flash-1017", 0.3, 1.2, 0.007],
  ["glm-5-2", 1.4, 4.4, 0.14],
  ["labs-leanstral-1-5-1", 0, 0, null],
  ["ministral-14b-2512", 0.2, 0.2, 0.02],
  ["ministral-3-14b-2512", 0.2, 0.2, 0.02],
  ["ministral-3-3b-2512", 0.1, 0.1, 0.01],
  ["ministral-3-8b-2512", 0.15, 0.15, 0.015],
  ["ministral-3b-2512", 0.1, 0.1, 0.01],
  ["ministral-8b-2512", 0.15, 0.15, 0.015],
  ["mistral-large-2512", 0.5, 1.5, 0.05],
  ["mistral-large-3", 0.5, 1.5, 0.05],
  ["mistral-large-4", 1.36, 4.18, 0.14],
  ["mistral-large-4-0", 1.36, 4.18, 0.14],
  ["mistral-medium", 1.5, 7.5, 0.15],
  ["mistral-medium-2604", 1.5, 7.5, 0.15],
  ["mistral-medium-3", 1.5, 7.5, 0.15],
  ["mistral-medium-3-5", 1.5, 7.5, 0.15],
  ["mistral-medium-3.5", 1.5, 7.5, 0.15],
  ["mistral-small", 0.1, 0.3, 0.01],
  ["mistral-small-2603", 0.15, 0.6, 0.015],
  ["mistral-tiny", 0.25, 0.25, 0.025],
  ["mistral-vibe-cli-fast", 0.15, 0.6, 0.015],
  ["mistral-vibe-cli-with-tools", 1.5, 7.5, 0.15],
  ["open-mistral-nemo", 0.3, 0.3, 0.03],
  ["voxtral-small-2507", 0.1, 0.4, 0.01],
  ["zai-glm-5", 1.4, 4.4, 0.14],
  ["zai-glm-5-2", 1.4, 4.4, 0.14],
  ["zai-glm-5-3", 1.4, 4.4, 0.14],
  ["zai-glm-5-3-flash", 0.15, 0.5, 0.03],
  ["gpt-4.1", 2, 8, 0.5],
  ["gpt-4.1-mini", 0.4, 1.6, 0.1],
  ["gpt-4o", 2.5, 10, 1.25],
  ["gpt-4o-mini", 0.15, 0.6, 0.075],
  ["gpt-5", 1.25, 10, 0.125],
  ["gpt-5-mini", 0.25, 2, 0.025],
  ["gpt-5-nano", 0.05, 0.4, 0.005],
  ["gpt-5-pro", 15, 120, null],
  ["gpt-5-search-api", 1.25, 10, 0.125],
  ["gpt-5.1", 1.25, 10, 0.125],
  ["gpt-5.2", 1.75, 14, 0.175],
  ["gpt-5.2-pro", 21, 168, null],
  ["gpt-5.3-codex", 1.75, 14, 0.175],
  ["gpt-5.4", 2.5, 15, 0.25],
  ["gpt-5.4-mini", 0.75, 4.5, 0.075],
  ["gpt-5.4-nano", 0.2, 1.25, 0.02],
  ["gpt-5.4-pro", 30, 180, null],
  ["gpt-5.5", 5, 30, 0.5],
  ["gpt-5.5-cyber", 12.5, 75, 1.25],
  ["gpt-5.5-cyber-preview", 12.5, 75, 1.25],
  ["gpt-5.5-pro", 30, 180, null],
  ["gpt-5.6", 4, 20, 0.4],
  ["gpt-5.6-cyber", 12.5, 75, 1.25],
  ["gpt-5.6-luna", 0.2, 1.2, 0.02],
  ["gpt-5.6-sol", 4, 20, 0.4],
  ["gpt-5.6-terra", 2, 12, 0.2],
  ["gpt-6-astra", 10, 50, 1],
  ["gpt-6-luna", 0.1, 0.5, 0.01],
  ["gpt-6-sol", 2, 10, 0.2],
  ["gpt-6.1-sol", 2, 10, 0.1],
  ["gpt-6.1-terra", 1, 5, 0.05],
  ["gpt-rosalind-discovery", 5, 25, 0.5],
  ["gpt-rosalind-research", 5, 25, 0.5],
  ["o3", 2, 8, 0.5],
  ["o3-pro", 20, 80, null],
  ["grok-4.20", 1.25, 2.5, 0.2],
  ["grok-4.20-0309", 1.25, 2.5, 0.2],
  ["grok-4.20-0309-non-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-0309-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-beta", 1.25, 2.5, 0.2],
  ["grok-4.20-beta-0309", 1.25, 2.5, 0.2],
  ["grok-4.20-beta-0309-non-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-beta-0309-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-beta-latest-non-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-beta-latest-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-beta-non-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-beta-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-experimental-beta-0304", 1.25, 2.5, 0.2],
  ["grok-4.20-experimental-beta-0304-non-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-experimental-beta-0304-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-multi-agent", 1.25, 2.5, 0.2],
  ["grok-4.20-multi-agent-0309", 1.25, 2.5, 0.2],
  ["grok-4.20-multi-agent-beta-0309", 1.25, 2.5, 0.2],
  ["grok-4.20-multi-agent-experimental-beta-0304", 1.25, 2.5, 0.2],
  ["grok-4.20-non-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-non-reasoning-gv2", 1.25, 2.5, 0.2],
  ["grok-4.20-reasoning", 1.25, 2.5, 0.2],
  ["grok-4.20-reasoning-gv2", 1.25, 2.5, 0.2],
  ["grok-4.3", 1.25, 2.5, 0.2],
  ["grok-4.5", 2, 6, 0.3],
  ["grok-4.6", 2, 6, 0.5],
  ["grok-4.7", 2, 6, 0.5],
  ["grok-build-0.1", 1, 2, 0.2],
  ["grok-code-fast", 1, 2, 0.2],
  ["grok-code-fast-1-0825", 1, 2, 0.2],
];

const USAGE_INSIGHTS_ROWS: readonly PriceRow[] = [
  ["claude-sonnet-4-20250514", 3, 15, 0.3],
  ["claude-3-5-haiku-20241022", 0.8, 4, 0.08],
];

/** Match key: lowercase, with `.`, `_` and `:` written as `-` (gpt-5.5 = gpt-5-5). */
const canonicalId = (id: string): string =>
  id.toLowerCase().replace(/[._:]/g, "-");

const toPrices = (
  rows: readonly PriceRow[],
  source: string,
  asOf: string,
): ModelPrice[] =>
  rows.map(([id, input, output, cached]) => ({
    modelId: id,
    inputPerMTok: input,
    outputPerMTok: output,
    ...(cached === null ? {} : { cachedPerMTok: cached }),
    source,
    asOf,
  }));

export const MODEL_PRICES: readonly ModelPrice[] = [
  ...toPrices(KOSMOS_ROWS, KOSMOS_SOURCE, KOSMOS_AS_OF),
  ...toPrices(LITELLM_ROWS, LITELLM_SOURCE, LITELLM_AS_OF),
  ...toPrices(USAGE_INSIGHTS_ROWS, USAGE_INSIGHTS_SOURCE, USAGE_INSIGHTS_AS_OF),
];

/**
 * Explicit aliases: a dated or vendor-specific id that is the same model as a
 * matrix row. Only add an entry when the two are known to be identical;
 * unlisted version suffixes are NOT matched.
 */
export const MODEL_PRICE_ALIASES: Readonly<Record<string, string>> = {
  "claude-sonnet-4-5-20250929": "claude-sonnet-4-5",
  "claude-haiku-4-5-20251001": "claude-haiku-4-5",
  "claude-opus-4-5-20251101": "claude-opus-4-5",
};

const PRICE_INDEX: ReadonlyMap<string, ModelPrice> = (() => {
  const index = new Map<string, ModelPrice>();
  for (const price of MODEL_PRICES) {
    const key = canonicalId(price.modelId);
    if (!index.has(key)) index.set(key, price);
  }
  return index;
})();

/**
 * Price for a model id, or null when the matrix has none. The routing prefix
 * (`openhands/`, `litellm_proxy/`, `openrouter/anthropic/`, ...) is dropped;
 * the rest must equal a matrix id or an entry of {@link MODEL_PRICE_ALIASES}.
 */
export function lookupModelPrice(
  model: string | null | undefined,
): ModelPrice | null {
  if (!model) return null;
  const name = canonicalId(model.slice(model.lastIndexOf("/") + 1));
  const aliases = MODEL_PRICE_ALIASES as Record<string, string | undefined>;
  const aliased = Object.hasOwn(aliases, name) ? aliases[name] : undefined;
  return PRICE_INDEX.get(aliased ? canonicalId(aliased) : name) ?? null;
}
