export const FREE_MODEL_BADGE_LABEL = "Free";

/** Suffix appended to a display name for a DB-flagged free OpenHands model. */
export const FREE_MODEL_SUFFIX = " (free)";

/**
 * Static pretty-print labels for OpenHands models known at build time. Free
 * status still comes only from the backend-provided `freeModels` set.
 */
export const FREE_OPENHANDS_MODELS = {
  "openhands/deepseek-v4-flash": "OpenHands DeepSeek V4 Flash",
} as const;

/**
 * Set of free ``provider/model`` ids. The frontend no longer hardcodes which
 * OpenHands models are free — the set is sourced from the backend model list
 * (DB-driven), the same channel that carries `verified`. See
 * {@link useFreeModels}. Callers that lack the set treat every model as paid.
 */
export type FreeModelSet = ReadonlySet<string>;

const EMPTY_FREE_MODELS: FreeModelSet = new Set<string>();

/**
 * Whether a model id routes through the OpenHands provider (the `openhands/`
 * prefix). On cloud the OpenHands provider is backed by a server-minted LLM
 * key rather than a user-supplied one, so callers use this to hide the inline
 * API key / base URL inputs and strip those fields from the save payload.
 */
export const isOpenHandsProviderModel = (
  model: string | null | undefined,
): boolean => Boolean(model?.startsWith("openhands/"));

export const isFreeOpenHandsModel = (
  model: string | null | undefined,
  freeModels: FreeModelSet = EMPTY_FREE_MODELS,
): boolean => Boolean(model && freeModels.has(model));

function appendFreeSuffix(display: string, isFree: boolean): string {
  return isFree ? `${display}${FREE_MODEL_SUFFIX}` : display;
}

export function formatModelNameForDisplay(
  model: string | null | undefined,
  freeModels: FreeModelSet = EMPTY_FREE_MODELS,
): string | null {
  if (!model) return null;
  return appendFreeSuffix(model, isFreeOpenHandsModel(model, freeModels));
}

/**
 * Format a native (OpenHands-kind) routing model string for display, stripping
 * the provider route prefix (e.g. ``"anthropic/claude-sonnet-4-5-20250929"`` →
 * ``"claude-sonnet-4-5-20250929"``, ``"litellm_proxy/openai/gpt-4o"`` →
 * ``"gpt-4o"``) so a conversation chip shows a meaningful model name rather than
 * the full routing path.
 *
 * Returns ``null`` for an empty/nullish input, and falls back to the original
 * string when stripping the prefix would leave nothing (e.g. a trailing slash)
 * — never an empty string, which would collapse the chip text.
 *
 * A DB-flagged free model (matched against ``freeModels`` on its full id) keeps
 * the free suffix so the chip still signals it is free.
 *
 * Display-only: unlike {@link deriveProfileNameFromModel} this does not sanitize
 * to an identifier, so it keeps the real model id intact for the chip.
 */
export function formatNativeModelName(
  model: string | null | undefined,
  freeModels: FreeModelSet = EMPTY_FREE_MODELS,
): string | null {
  if (!model) return null;
  const isFree = isFreeOpenHandsModel(model, freeModels);
  const lastSegment = model.split("/").pop();
  return appendFreeSuffix(lastSegment || model, isFree);
}

/**
 * Display label used by the LLM-profile picker sub-line. Looks up the model in
 * the static label table for a prettier name, but appends `(free)` only when the
 * backend-provided `freeModels` set marks the concrete model free.
 */
export function formatModelPillLabel(
  model: string | null | undefined,
  freeModels: FreeModelSet = EMPTY_FREE_MODELS,
): string | null {
  if (!model) return null;
  const display =
    model in FREE_OPENHANDS_MODELS
      ? FREE_OPENHANDS_MODELS[model as keyof typeof FREE_OPENHANDS_MODELS]
      : model;
  return appendFreeSuffix(display, isFreeOpenHandsModel(model, freeModels));
}

/** Words whose canonical spelling is not plain Title Case. Keys are lowercase. */
const MODEL_WORD_SPELLINGS: Readonly<Record<string, string>> = {
  gpt: "GPT",
  llm: "LLM",
  glm: "GLM",
  deepseek: "DeepSeek",
  claude: "Claude",
  openai: "OpenAI",
  openhands: "OpenHands",
};

function titleCaseWord(word: string): string {
  const known = MODEL_WORD_SPELLINGS[word.toLowerCase()];
  if (known) return known;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Pretty-print a model id: drop the provider route prefix, split on hyphens
 * and title-case each word, keeping known acronyms and brand spellings
 * (``"gpt-5.6-sol"`` → ``"GPT 5.6 Sol"``, ``"deepseek-v4-flash"`` →
 * ``"DeepSeek V4 Flash"``). A user-given ``override`` always wins. Returns
 * ``null`` for an empty model with no override.
 */
export function prettifyModelName(
  model: string | null | undefined,
  override?: string | null,
): string | null {
  const trimmedOverride = override?.trim();
  if (trimmedOverride) return trimmedOverride;
  if (!model) return null;
  const lastSegment = model.split("/").pop() || model;
  const words = lastSegment.split("-").filter(Boolean);
  if (words.length === 0) return model;
  return words.map(titleCaseWord).join(" ");
}

/** Provider key for a model id: its route prefix, or ``null`` when it has none. */
export function getModelProvider(
  model: string | null | undefined,
): string | null {
  if (!model?.includes("/")) return null;
  const prefix = model.split("/")[0].trim().toLowerCase();
  return prefix || null;
}

/** Display name for a provider key (``"openai"`` → ``"OpenAI"``). */
export function formatProviderName(provider: string): string {
  return provider.split(/[-_]/).filter(Boolean).map(titleCaseWord).join(" ");
}

/**
 * Chip/list label for an LLM profile's model: a user override, else the static
 * OpenHands label, else the prettified model id; a backend-flagged free model
 * keeps the free suffix.
 */
export function formatModelPrettyLabel(
  model: string | null | undefined,
  freeModels: FreeModelSet = EMPTY_FREE_MODELS,
  override?: string | null,
): string | null {
  const trimmedOverride = override?.trim();
  if (!model) return trimmedOverride || null;
  const display =
    trimmedOverride ||
    (model in FREE_OPENHANDS_MODELS
      ? FREE_OPENHANDS_MODELS[model as keyof typeof FREE_OPENHANDS_MODELS]
      : prettifyModelName(model));
  return appendFreeSuffix(
    display ?? model,
    isFreeOpenHandsModel(model, freeModels),
  );
}
