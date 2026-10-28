import { ArrowUp, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

export interface ChatSendButtonProps {
  buttonClassName: string;
  handleSubmit: () => void;
  disabled: boolean;
  isPending?: boolean;
}

export function ChatSendButton({
  buttonClassName,
  handleSubmit,
  disabled,
  isPending = false,
}: ChatSendButtonProps) {
  const { t } = useTranslation("openhands");

  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center rounded-full size-8 border transition-all duration-300 ease-out motion-reduce:transition-none",
        disabled
          ? "cursor-not-allowed border-muted bg-transparent opacity-60 shadow-none"
          : "cursor-pointer border-white bg-linear-to-b from-white to-neutral-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_4px_rgba(0,0,0,0.3)] animate-[send-button-in_240ms_ease-out_both] motion-reduce:animate-none hover:from-neutral-100 hover:to-neutral-300",
        buttonClassName,
      )}
      data-name="arrow-up-circle-fill"
      data-testid="submit-button"
      onClick={handleSubmit}
      disabled={disabled}
      aria-busy={isPending}
      aria-label={t(I18nKey.CHAT_INTERFACE$TOOLTIP_SEND_MESSAGE)}
    >
      {isPending ? (
        <Loader2
          data-testid="submit-button-pending-icon"
          className="size-4 animate-spin text-[var(--oh-muted)]"
          aria-hidden
        />
      ) : (
        <ArrowUp
          className="w-4 h-4"
          color={disabled ? "var(--oh-muted)" : "var(--oh-contrast)"}
        />
      )}
    </button>
  );
}
