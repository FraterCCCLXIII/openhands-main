import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import CircleErrorIcon from "#/icons/circle-error.svg?react";
import { statusToneBadgeClassName } from "#/utils/status-tone-classes";

/** Error sandbox pill beside the conversation title (archived uses the status column icon only). */
export function ConversationStatusBadges() {
  const { t } = useTranslation("openhands");

  return (
    <span
      data-testid="error-badge"
      className={`mr-2 flex items-center gap-1 px-1.5 py-0.5 ${statusToneBadgeClassName.danger} text-[11px] font-medium leading-4 rounded-full`}
    >
      <CircleErrorIcon className="text-danger w-2.5 h-2.5" />
      <span>{t(I18nKey.COMMON$ERROR)}</span>
    </span>
  );
}
