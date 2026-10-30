import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BrandButton } from "#/components/features/settings/brand-button";
import { SettingsInput } from "#/components/features/settings/settings-input";
import { BaseModalTitle } from "#/components/shared/modals/confirmation-modals/base-modal";
import { ModalBackdrop } from "#/components/shared/modals/modal-backdrop";
import { ModalBody } from "#/components/shared/modals/modal-body";
import { I18nKey } from "#/i18n/declaration";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import {
  IconAppearancePanel,
  type IconAppearanceValue,
} from "#/ui/icon-appearance-picker";
import { factoryIconKey } from "#/utils/feed-icon-keys";
import {
  FEED_ME_ID,
  FEED_TEAMMATES,
  isFeedTeamDemoEnabled,
} from "#/utils/feed-team-demo";

interface AddFactoryModalProps {
  onClose: () => void;
  /** Called with the new factory's id once it is saved. */
  onCreated: (factoryId: string) => void;
}

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Creates a factory: a name, a description, an owner and an icon. */
export function AddFactoryModal({ onClose, onCreated }: AddFactoryModalProps) {
  const { t } = useTranslation("openhands");
  const addFactory = useFeedFactoriesStore((state) => state.addFactory);
  const setIcon = useFeedIconsStore((state) => state.setIcon);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ownerId, setOwnerId] = useState(FEED_ME_ID);
  const [icon, setIconValue] = useState<IconAppearanceValue>({});
  const canCreate = name.trim().length > 0;

  const create = () => {
    if (!canCreate) return;
    const id = `custom-${slugify(name) || "factory"}-${Date.now().toString(36)}`;
    addFactory({
      id,
      name: name.trim(),
      description: description.trim(),
      ownerId,
    });
    setIcon(factoryIconKey(id), icon);
    onCreated(id);
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <ModalBody
        testID="add-factory-modal"
        className="items-start border border-border"
      >
        <BaseModalTitle title={t(I18nKey.AUTOMATE$ADD_FACTORY)} />
        <div
          className="flex w-full flex-col"
          onClick={(event) => event.stopPropagation()}
        >
          <form
            className="flex w-full flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              create();
            }}
          >
            <SettingsInput
              testId="add-factory-name"
              name="factory-name"
              type="text"
              label={t(I18nKey.SETTINGS$NAME)}
              value={name}
              onChange={setName}
              className="w-full"
              showRequiredTag
            />
            <SettingsInput
              testId="add-factory-description"
              name="factory-description"
              type="text"
              label={t(I18nKey.FORM$DESCRIPTION)}
              value={description}
              onChange={setDescription}
              className="w-full"
            />
            <label className="flex flex-col gap-2 text-sm text-contrast">
              {t(I18nKey.FEED$FACTORY_OWNER)}
              <select
                data-testid="add-factory-owner"
                value={ownerId}
                onChange={(event) => setOwnerId(event.target.value)}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-contrast"
              >
                <option value={FEED_ME_ID}>{t(I18nKey.FEED$ROLE_YOU)}</option>
                {(isFeedTeamDemoEnabled(window.location.search)
                  ? FEED_TEAMMATES
                  : []
                ).map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-col gap-3">
              <IconAppearancePanel value={icon} onChange={setIconValue} />
            </div>
            <div className="flex justify-end gap-2">
              <BrandButton
                type="button"
                variant="secondary"
                testId="add-factory-cancel"
                onClick={onClose}
              >
                {t(I18nKey.BUTTON$CANCEL)}
              </BrandButton>
              <BrandButton
                type="submit"
                variant="primary"
                testId="add-factory-create"
                isDisabled={!canCreate}
              >
                {t(I18nKey.BUTTON$CREATE)}
              </BrandButton>
            </div>
          </form>
        </div>
      </ModalBody>
    </ModalBackdrop>
  );
}
