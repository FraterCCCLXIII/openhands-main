import { useState } from "react";
import { useSendMessage } from "#/hooks/use-send-message";
import { cn } from "#/utils/utils";

/**
 * A decision card is a fenced block the agent writes in its reply:
 *
 * ```decision
 * {
 *   "question": "Should session open rebase via a SessionStart hook?",
 *   "options": [
 *     { "label": "SessionStart hook", "description": "Runs on every session" },
 *     { "label": "git pull.rebase", "description": "One global git setting" }
 *   ],
 *   "recommended": 0
 * }
 * ```
 *
 * The chat shows it as a question with one button per option. Clicking a
 * button sends that option's label back as the user's next message.
 */
export const DECISION_LANGUAGE = "decision";
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 4;

export interface DecisionOption {
  label: string;
  description?: string;
}

export interface DecisionCardSpec {
  question: string;
  options: DecisionOption[];
  /** Index of the option to style as the default choice. */
  recommended?: number;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Parses a `decision` block body. Returns null for anything malformed, so the
 * caller can fall back to showing the raw text as a code block.
 */
export function parseDecisionCard(source: string): DecisionCardSpec | null {
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;

  const { question, options, recommended } = data as Record<string, unknown>;
  if (!isNonEmptyString(question) || !Array.isArray(options)) return null;
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) return null;

  const parsedOptions: DecisionOption[] = [];
  for (const option of options) {
    if (typeof option !== "object" || option === null) return null;
    const { label, description } = option as Record<string, unknown>;
    if (!isNonEmptyString(label)) return null;
    parsedOptions.push({
      label,
      description: isNonEmptyString(description) ? description : undefined,
    });
  }

  const hasRecommended =
    typeof recommended === "number" &&
    Number.isInteger(recommended) &&
    recommended >= 0 &&
    recommended < parsedOptions.length;

  return {
    question,
    options: parsedOptions,
    recommended: hasRecommended ? (recommended as number) : undefined,
  };
}

export function DecisionCard({ spec }: { spec: DecisionCardSpec }) {
  const { send } = useSendMessage();
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const isAnswered = chosenIndex !== null;

  const choose = (index: number) => {
    setChosenIndex(index);
    send({
      action: "message",
      args: {
        content: spec.options[index].label,
        timestamp: new Date().toISOString(),
      },
    }).catch(() => setChosenIndex(null));
  };

  return (
    <section
      data-testid="decision-card"
      aria-label={spec.question}
      className="my-3 flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4"
    >
      <p className="text-sm font-medium text-foreground">{spec.question}</p>
      <div className="flex flex-col gap-2">
        {spec.options.map((option, index) => {
          const isRecommended = index === spec.recommended;
          return (
            <button
              key={option.label}
              type="button"
              disabled={isAnswered}
              onClick={() => choose(index)}
              className={cn(
                "flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                isRecommended
                  ? "bg-contrast text-contrast-foreground"
                  : "bg-contrast/5 text-foreground hover:bg-contrast/10",
                isAnswered && "cursor-default opacity-50",
              )}
            >
              <span className="font-medium">{option.label}</span>
              {option.description ? (
                <span
                  className={cn(
                    "text-xs",
                    isRecommended ? "opacity-70" : "text-muted",
                  )}
                >
                  {option.description}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
