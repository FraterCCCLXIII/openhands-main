import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LlmSettingsLocalView } from "#/components/features/settings/llm-profiles";
import { SettingsSectionHeaderProvider } from "#/contexts/settings-section-header-context";
import { I18nKey } from "#/i18n/declaration";
import { settingsLikeMainScrollClassName } from "#/utils/settings-like-page-layout-classes";
import { cn } from "#/utils/utils";

/**
 * Standalone LLMs page: the same profile / provider-connection manager as
 * Settings > LLM, but in the normal app shell without the settings nav. The
 * manager hides this page header while its create/edit form is open, exactly
 * as the settings layout does for /settings/llm.
 */
export default function LlmsScreen() {
  const { t } = useTranslation("openhands");
  const [hideSectionHeader, setHideSectionHeader] = useState(false);

  return (
    <div data-testid="llms-screen" className="flex h-full">
      <main className={cn(settingsLikeMainScrollClassName, "h-full")}>
        <div className="mx-auto flex w-full min-w-0 max-w-200 flex-col gap-6">
          {!hideSectionHeader && (
            <header className="min-w-0 space-y-1">
              <h2 className="text-xl font-semibold leading-6 tracking-tight text-foreground">
                {t(I18nKey.NAV$LLMS)}
              </h2>
              <p className="max-w-2xl text-sm leading-5 text-tertiary-light">
                {t(I18nKey.SETTINGS$PAGE_LLM_SUBLINE)}
              </p>
            </header>
          )}
          <SettingsSectionHeaderProvider
            setHideSectionHeader={setHideSectionHeader}
          >
            <LlmSettingsLocalView />
          </SettingsSectionHeaderProvider>
        </div>
      </main>
    </div>
  );
}
