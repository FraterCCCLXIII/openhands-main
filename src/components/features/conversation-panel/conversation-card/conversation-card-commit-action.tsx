import React from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, GitCommitHorizontal } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import type { ConversationGitState } from "#/stores/conversation-diff-stats-store";

export type CommitNextStep = "commit" | "push" | "pull-request" | "resolve";

/**
 * The next git step a workspace most likely needs, read from its git state.
 * Clean or untracked trees have nothing to commit yet, so they default to
 * commit as well: the menu still offers every step.
 */
export function recommendedCommitStep(
  gitState: ConversationGitState | undefined,
): CommitNextStep {
  if (gitState === "ahead") return "push";
  if (gitState === "conflict") return "resolve";
  return "commit";
}

const NEXT_STEPS: CommitNextStep[] = [
  "commit",
  "push",
  "pull-request",
  "resolve",
];

const STEP_LABEL_KEYS: Record<CommitNextStep, I18nKey> = {
  commit: I18nKey.CONVERSATION$GIT_STEP_COMMIT,
  push: I18nKey.CONVERSATION$GIT_STEP_PUSH,
  "pull-request": I18nKey.CONVERSATION$GIT_STEP_PULL_REQUEST,
  resolve: I18nKey.CONVERSATION$GIT_STEP_RESOLVE,
};

export interface ConversationCardCommitActionProps {
  gitState: ConversationGitState | undefined;
  onSelectStep?: (step: CommitNextStep) => void;
}

/**
 * A git commit object on the right of the diff row. It is hidden until the
 * card is hovered or focused, shows the recommended next step, and opens a
 * menu of the other steps. Clicks stop here so the card does not open.
 */
export function ConversationCardCommitAction({
  gitState,
  onSelectStep,
}: ConversationCardCommitActionProps) {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);
  const recommended = recommendedCommitStep(gitState);
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return undefined;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (
        event instanceof MouseEvent &&
        containerRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const stopCardClick = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const choose = (step: CommitNextStep) => {
    setOpen(false);
    onSelectStep?.(step);
  };

  return (
    <div
      ref={containerRef}
      data-testid="conversation-card-commit-action"
      onClick={stopCardClick}
      onKeyDown={stopCardClick}
      className={cn(
        "relative flex items-center gap-0.5 transition-opacity duration-150",
        open
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
      )}
    >
      <button
        type="button"
        onClick={() => choose(recommended)}
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted hover:bg-surface-raised hover:text-contrast"
      >
        <GitCommitHorizontal className="size-3.5" aria-hidden />
        <span>{t(STEP_LABEL_KEYS[recommended])}</span>
      </button>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t(I18nKey.CONVERSATION$GIT_NEXT_STEP_OPTIONS)}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center rounded-md p-0.5 text-muted hover:bg-surface-raised hover:text-contrast"
      >
        <ChevronDown className="size-3.5" aria-hidden />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 min-w-44 rounded-md border border-border bg-surface-raised p-1 shadow-lg"
        >
          {NEXT_STEPS.map((step) => (
            <button
              key={step}
              type="button"
              role="menuitem"
              onClick={() => choose(step)}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-surface",
                step === recommended ? "text-contrast" : "text-muted",
              )}
            >
              <GitCommitHorizontal className="size-3.5" aria-hidden />
              <span className="flex-1">{t(STEP_LABEL_KEYS[step])}</span>
              {step === recommended ? (
                <span className="text-[10px] uppercase tracking-wide text-muted">
                  {t(I18nKey.CONVERSATION$GIT_RECOMMENDED)}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
