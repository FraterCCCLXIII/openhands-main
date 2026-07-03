import { X } from "lucide-react";

import { cn } from "@/src/lib/utils";

interface ModalCloseButtonProps {
  onClose: () => void;
  testId?: string;
  className?: string;
  disabled?: boolean;
}

export function ModalCloseButton({
  onClose,
  testId,
  className,
  disabled = false,
}: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClose}
      disabled={disabled}
      aria-label="Close"
      className={cn(
        "absolute right-4 top-4 z-10 flex cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-1 text-tertiary-alt transition-colors hover:bg-surface-raised hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <X className="size-4" aria-hidden />
    </button>
  );
}
