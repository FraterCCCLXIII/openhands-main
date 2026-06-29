import { Copy, Eye, EyeOff, Plus, RotateCw } from "lucide-react";

import { cn } from "@/src/lib/utils";
import {
  formControlBorderClassName,
  formControlRadiusClassName,
} from "@/src/styles/form-control-classes";
import { settingsListIconActionButtonClassName } from "@/src/styles/settings-list-classes";

interface ApiKeyFieldProps {
  value: string;
  isRevealed: boolean;
  onToggleReveal: () => void;
  onCopy: () => void;
  onRotate?: () => void;
  onCreate?: () => void;
  copyAriaLabel: string;
  rotateAriaLabel?: string;
  createAriaLabel?: string;
  revealDisabled?: boolean;
  copyDisabled?: boolean;
  rotateDisabled?: boolean;
  className?: string;
}

export function ApiKeyField({
  value,
  isRevealed,
  onToggleReveal,
  onCopy,
  onRotate,
  onCreate,
  copyAriaLabel,
  rotateAriaLabel,
  createAriaLabel,
  revealDisabled = false,
  copyDisabled = false,
  rotateDisabled = false,
  className,
}: ApiKeyFieldProps) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 items-center gap-1 sm:w-auto",
        formControlRadiusClassName,
        formControlBorderClassName,
        "bg-[var(--oh-bg-input)] py-1 pl-3 pr-1",
        className,
      )}
    >
      <code
        className="min-w-0 max-w-[10rem] flex-1 truncate font-mono text-xs text-[var(--oh-text-secondary)] sm:max-w-[14rem] md:max-w-[18rem]"
        title={value}
      >
        {value}
      </code>
      <div className="ml-1 flex shrink-0 items-center gap-0.5 border-l border-[var(--oh-border)] pl-1">
        <button
          type="button"
          aria-label={isRevealed ? "Hide key" : "Reveal key"}
          onClick={onToggleReveal}
          disabled={revealDisabled}
          className={settingsListIconActionButtonClassName}
        >
          {isRevealed ? (
            <EyeOff aria-hidden className="size-4" strokeWidth={2} />
          ) : (
            <Eye aria-hidden className="size-4" strokeWidth={2} />
          )}
        </button>
        <button
          type="button"
          aria-label={copyAriaLabel}
          onClick={onCopy}
          disabled={copyDisabled}
          className={settingsListIconActionButtonClassName}
        >
          <Copy aria-hidden className="size-4" strokeWidth={2} />
        </button>
        {onRotate ? (
          <button
            type="button"
            aria-label={rotateAriaLabel}
            onClick={onRotate}
            disabled={rotateDisabled}
            className={settingsListIconActionButtonClassName}
          >
            <RotateCw aria-hidden className="size-4" strokeWidth={2} />
          </button>
        ) : null}
        {onCreate ? (
          <button
            type="button"
            aria-label={createAriaLabel}
            onClick={onCreate}
            disabled={rotateDisabled}
            className={settingsListIconActionButtonClassName}
          >
            <Plus aria-hidden className="size-4" strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
