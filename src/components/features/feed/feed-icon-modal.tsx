import { useTranslation } from "react-i18next";
import { BrandButton } from "#/components/features/settings/brand-button";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { I18nKey } from "#/i18n/declaration";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { IconAppearancePanel } from "#/ui/icon-appearance-picker";

interface FeedIconModalProps {
  /** Key into the feed icons store. */
  iconKey: string;
  /** What is being customized, shown under the title. */
  subject: string;
  onClose: () => void;
}

/** Edits an icon and its color. Changes apply as they are made. */
export function FeedIconModal({
  iconKey,
  subject,
  onClose,
}: FeedIconModalProps) {
  const { t } = useTranslation("openhands");
  const value = useFeedIconsStore((state) => state.icons[iconKey]);
  const setIcon = useFeedIconsStore((state) => state.setIcon);

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody
        testID="feed-icon-modal"
        className="items-start border border-border"
      >
        <div className="flex flex-col gap-1">
          <BaseModalTitle title={t(I18nKey.FEED$ICON_CUSTOMIZE)} />
          <p className="text-sm text-muted">{subject}</p>
        </div>
        <div
          className="flex w-full flex-col gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          <IconAppearancePanel
            value={value ?? {}}
            onChange={(next) => setIcon(iconKey, next)}
          />
        </div>
        <div className="flex w-full justify-end">
          <BrandButton
            type="button"
            variant="secondary"
            testId="feed-icon-modal-close"
            onClick={onClose}
          >
            {t(I18nKey.BUTTON$CLOSE)}
          </BrandButton>
        </div>
      </ModalBody>
    </ModalBackdrop>
  );
}
