"use client";

import { SettingsSwitch } from "@/src/components/settings/settings-switch";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";

export const getIntegrationEnableRowTestId = (integrationKey: string) =>
  `integration-detail-modal-enable-row-${integrationKey}`;

export const getIntegrationEnableToggleTestId = (integrationKey: string) =>
  `integration-detail-modal-toggle-${integrationKey}`;

export function IntegrationEnableRow({
  integrationKey,
  enabled,
  disabled = false,
  onToggle,
}: {
  integrationKey: string;
  enabled: boolean;
  disabled?: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div
      data-testid={getIntegrationEnableRowTestId(integrationKey)}
      className="flex w-full items-center rounded-lg border border-[var(--oh-border)] bg-[rgba(255,255,255,0.04)] px-3 py-2.5"
    >
      <SettingsSwitch
        testId={getIntegrationEnableToggleTestId(integrationKey)}
        isToggled={enabled}
        isDisabled={disabled}
        togglePosition="right"
        onToggle={onToggle}
      >
        {enabled
          ? INTEGRATIONS_PAGE_COPY.installedEnabledStateLabel
          : INTEGRATIONS_PAGE_COPY.installedDisabledStateLabel}
      </SettingsSwitch>
    </div>
  );
}
