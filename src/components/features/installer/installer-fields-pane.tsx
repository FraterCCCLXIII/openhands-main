import { Fragment } from "react";
import { useTranslation } from "react-i18next";
import { SettingsDropdownInput } from "#/components/features/settings/settings-dropdown-input";
import { SettingsInput } from "#/components/features/settings/settings-input";
import { SettingsSwitch } from "#/components/features/settings/settings-switch";
import { I18nKey } from "#/i18n/declaration";
import { Divider } from "#/ui/divider";
import { Paragraph, Text } from "#/ui/typography";
import { InstallerSection } from "./installer-section";
import {
  INSTALLER_REQUIRED_FIELD_IDS,
  INSTALLER_SECTIONS,
  type InstallerField,
} from "./installer-fields";

interface InstallerFieldsPaneProps {
  values: Record<string, string>;
  switches: Record<string, boolean>;
  onFieldChange: (id: string, value: string) => void;
  onSwitchChange: (id: string, value: boolean) => void;
}

function isRequiredFilled(
  field: InstallerField,
  values: Record<string, string>,
) {
  return Boolean(values[field.id]?.trim());
}

export function InstallerFieldsPane({
  values,
  switches,
  onFieldChange,
  onSwitchChange,
}: InstallerFieldsPaneProps) {
  const { t } = useTranslation("openhands");
  const filledRequired = INSTALLER_SECTIONS.flatMap((section) =>
    section.fields.filter((field) => field.required),
  ).filter((field) => isRequiredFilled(field, values)).length;

  return (
    <div
      data-testid="installer-fields-pane"
      className="flex h-full w-full flex-col bg-[var(--oh-surface)] border-l border-[var(--oh-border)] overflow-hidden"
    >
      <div
        data-testid="installer-fields-header"
        className="flex shrink-0 flex-col gap-0.5 border-b border-[var(--oh-border)] px-4 py-2"
      >
        <Text className="font-medium">{t(I18nKey.INSTALLER$FIELDS_TITLE)}</Text>
        <Paragraph className="text-xs text-[var(--oh-muted)]">
          {t(I18nKey.INSTALLER$FIELDS_SUBTITLE)}
        </Paragraph>
        <Paragraph className="text-xs text-[var(--oh-muted)]">
          {t(I18nKey.INSTALLER$PROGRESS, {
            filled: filledRequired,
            total: INSTALLER_REQUIRED_FIELD_IDS.length,
          })}
        </Paragraph>
      </div>
      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-5">
        <div className="mx-auto flex w-full max-w-[440px] flex-col">
          {INSTALLER_SECTIONS.map((section, index) => (
            <Fragment key={section.id}>
              {index > 0 ? (
                <Divider
                  className="my-6"
                  testId={`installer-section-divider-${section.id}`}
                />
              ) : null}
              <InstallerSection title={t(section.titleKey)}>
                {section.fields.map((field) => {
                  if (field.type === "switch") {
                    return (
                      <SettingsSwitch
                        key={field.id}
                        testId={`installer-field-${field.id}`}
                        name={field.id}
                        isToggled={switches[field.id]}
                        onToggle={(value) => onSwitchChange(field.id, value)}
                      >
                        {t(field.labelKey)}
                      </SettingsSwitch>
                    );
                  }

                  if (field.type === "select" && field.options) {
                    return (
                      <SettingsDropdownInput
                        key={field.id}
                        testId={`installer-field-${field.id}`}
                        name={field.id}
                        label={t(field.labelKey)}
                        selectedKey={values[field.id] || undefined}
                        items={field.options.map((option) => ({
                          key: option.key,
                          label: t(option.labelKey),
                        }))}
                        onSelectionChange={(key) =>
                          onFieldChange(field.id, key ? String(key) : "")
                        }
                      />
                    );
                  }

                  return (
                    <SettingsInput
                      key={field.id}
                      testId={`installer-field-${field.id}`}
                      name={field.id}
                      type={field.type === "number" ? "number" : field.type}
                      label={t(field.labelKey)}
                      value={values[field.id] ?? ""}
                      placeholder={
                        field.placeholderKey
                          ? t(field.placeholderKey)
                          : undefined
                      }
                      showRequiredTag={field.required}
                      showOptionalTag={!field.required}
                      onChange={(value) => onFieldChange(field.id, value)}
                    />
                  );
                })}
              </InstallerSection>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
