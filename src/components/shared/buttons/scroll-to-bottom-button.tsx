import ArrowSendIcon from "#/icons/arrow-send.svg?react";

interface ScrollToBottomButtonProps {
  onClick: () => void;
}

export function ScrollToBottomButton({ onClick }: ScrollToBottomButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid="scroll-to-bottom"
      className="flex items-center justify-center size-10 rounded-full border border-white/15 bg-linear-to-b from-surface to-tertiary text-muted shadow-[0_2px_8px_rgba(0,0,0,0.35)] hover:scale-105 hover:border-white/30 hover:bg-tertiary hover:text-contrast rotate-180 cursor-pointer transition-[color,background-color,border-color,transform] duration-200 ease-out motion-reduce:transition-none"
    >
      <ArrowSendIcon width={15} height={15} />
    </button>
  );
}
