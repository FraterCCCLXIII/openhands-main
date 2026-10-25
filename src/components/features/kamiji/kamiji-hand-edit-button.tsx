import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { KamijiHandAvatar } from "./kamiji-hand-avatar";

interface KamijiHandEditButtonProps {
  onClick: () => void;
}

/** A row showing the user's current Hand; opens the Hand editor. */
export function KamijiHandEditButton({ onClick }: KamijiHandEditButtonProps) {
  const { t } = useTranslation("openhands");
  return (
    <button
      type="button"
      data-testid="kamiji-hand-edit-button"
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-sm text-contrast hover:bg-surface-raised"
    >
      <KamijiHandAvatar size={28} />
      <span>{t(I18nKey.KAMIJI$EDIT_HAND)}</span>
    </button>
  );
}
