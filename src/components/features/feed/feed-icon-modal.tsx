import { useTranslation } from "react-i18next";
import { BrandButton } from "#/components/features/settings/brand-button";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { I18nKey } from "#/i18n/declaration";
import { useFeedProjectIconsStore } from "#/stores/feed-project-icons-store";
import { IconAppearancePanel } from "#/ui/icon-appearance-picker";

interface FeedProjectIconModalProps {
  project: string;
  onClose: () => void;
}

/** Edits a project's icon and color. Changes apply as they are made. */
export function FeedProjectIconModal({
  project,
  onClose,
}: FeedProjectIconModalProps) {
  const { t } = useTranslation("openhands");
  const value = useFeedProjectIconsStore(
    (state) => state.iconsByProject[project],
  );
  const setIcon = useFeedProjectIconsStore((state) => state.setIcon);

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody
        testID="feed-project-icon-modal"
        className="items-start border border-border"
      >
        <div className="flex flex-col gap-1">
          <BaseModalTitle title={t(I18nKey.FEED$ICON_CUSTOMIZE)} />
          <p className="text-sm text-muted">{project}</p>
        </div>
        <div
          className="flex w-full flex-col gap-3"
          onClick={(event) => event.stopPropagation()}
        >
          <IconAppearancePanel
            value={value ?? {}}
            onChange={(next) => setIcon(project, next)}
          />
        </div>
        <div className="flex w-full justify-end">
          <BrandButton
            type="button"
            variant="secondary"
            testId="feed-project-icon-modal-close"
            onClick={onClose}
          >
            {t(I18nKey.BUTTON$CLOSE)}
          </BrandButton>
        </div>
      </ModalBody>
    </ModalBackdrop>
  );
}
