import { useTranslation } from "react-i18next";
import { Play, Loader2, Check } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";

interface RunCommandButtonProps {
  isHidden: boolean;
  isDisabled: boolean;
  onClick: () => void;
  mode: "run" | "running" | "done";
}

export function RunCommandButton({
  isHidden,
  isDisabled,
  onClick,
  mode,
}: RunCommandButtonProps) {
  const { t } = useTranslation("openhands");

  const label =
    mode === "run"
      ? t(I18nKey.BUTTON$RUN_COMMAND)
      : mode === "running"
        ? t(I18nKey.BUTTON$RUNNING)
        : t(I18nKey.BUTTON$COMMAND_SENT);

  return (
    <button
      hidden={isHidden}
      disabled={isDisabled || mode === "running"}
      data-testid="run-command"
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="button-base p-1 cursor-pointer text-success hover:text-success/80 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {mode === "run" && <Play width={15} height={15} />}
      {mode === "running" && (
        <Loader2 width={15} height={15} className="animate-spin" />
      )}
      {mode === "done" && <Check width={15} height={15} />}
    </button>
  );
}
