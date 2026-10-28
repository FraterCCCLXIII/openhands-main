/** Markdown fence language that selects the multiple-choice template. */
export const CHOICE_TEMPLATE_LANGUAGE = "choice";

export const CHOICE_MIN_OPTIONS = 2;
export const CHOICE_MAX_OPTIONS = 6;

export interface ChoiceOption {
  label: string;
  description?: string;
}

export interface ChoiceTemplate {
  question: string;
  options: ChoiceOption[];
  allowOther: boolean;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function parseOption(raw: unknown): ChoiceOption | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { label, description } = raw as Record<string, unknown>;
  if (!isNonEmptyString(label)) return null;
  if (description !== undefined && typeof description !== "string") return null;
  return description?.trim()
    ? { label: label.trim(), description: description.trim() }
    : { label: label.trim() };
}

/**
 * Parses the body of a ```choice fence. Returns null for invalid JSON or an
 * invalid shape so callers can fall back to a normal code block.
 */
export function parseChoiceTemplate(source: string): ChoiceTemplate | null {
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return null;
  }
  const { question, options, allowOther } = data as Record<string, unknown>;
  if (!isNonEmptyString(question)) return null;
  if (
    !Array.isArray(options) ||
    options.length < CHOICE_MIN_OPTIONS ||
    options.length > CHOICE_MAX_OPTIONS
  ) {
    return null;
  }
  if (allowOther !== undefined && typeof allowOther !== "boolean") return null;

  const parsed: ChoiceOption[] = [];
  for (const raw of options) {
    const option = parseOption(raw);
    if (!option) return null;
    parsed.push(option);
  }
  return {
    question: question.trim(),
    options: parsed,
    allowOther: allowOther ?? false,
  };
}
