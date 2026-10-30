import { useTranslation } from "react-i18next";
import { BUILT_IN_APPS, getBuiltInApp } from "#/built-in-apps/registry";
import { SettingsSwitch } from "#/components/features/settings/settings-switch";
import { I18nKey } from "#/i18n/declaration";
import {
  getEnabledDependents,
  isBuiltInAppEnabled,
  useBuiltInAppsBackendId,
  useBuiltInAppsStore,
} from "#/stores/built-in-apps-store";

/**
 * Customize > Apps: one switch per built-in app. A switch only hides the app's
 * navigation and routes; its data is kept, so turning it back on restores it.
 * A switch whose app cannot safely change on its own is disabled and says why.
 */
export function BuiltInAppsSection() {
  const { t } = useTranslation("openhands");
  const backendId = useBuiltInAppsBackendId();
  const byBackend = useBuiltInAppsStore((state) => state.byBackend);
  const setEnabled = useBuiltInAppsStore((state) => state.setEnabled);

  return (
    <section
      data-testid="built-in-apps-section"
      aria-labelledby="built-in-apps-heading"
      className="flex flex-col gap-3"
    >
      <div className="space-y-1">
        <h3
          id="built-in-apps-heading"
          className="text-lg font-bold text-contrast"
        >
          {t(I18nKey.BUILT_IN_APPS$SECTION_TITLE)}
        </h3>
        <p className="text-sm text-tertiary-light">
          {t(I18nKey.BUILT_IN_APPS$SECTION_DESCRIPTION)}
        </p>
      </div>
      <ul className="flex flex-col divide-y divide-border rounded-xl border border-border bg-base-secondary">
        {BUILT_IN_APPS.map((app) => {
          const enabled = isBuiltInAppEnabled(byBackend, backendId, app.id);
          const dependents = getEnabledDependents(byBackend, backendId, app.id);
          const missingRequirement = (app.requires ?? []).find(
            (required) => !isBuiltInAppEnabled(byBackend, backendId, required),
          );
          let lockReason: string | null = null;
          if (dependents.length > 0 && enabled) {
            lockReason = t(I18nKey.BUILT_IN_APPS$LOCKED_BY_DEPENDENT, {
              apps: dependents
                .map((id) => t(getBuiltInApp(id).nameKey))
                .join(", "),
            });
          } else if (missingRequirement && !enabled) {
            lockReason = t(I18nKey.BUILT_IN_APPS$LOCKED_BY_REQUIREMENT, {
              app: t(getBuiltInApp(missingRequirement).nameKey),
            });
          }
          const name = t(app.nameKey);
          return (
            <li
              key={app.id}
              data-testid={`built-in-app-row-${app.id}`}
              className="flex flex-col gap-1 px-4 py-3"
            >
              <SettingsSwitch
                testId={`built-in-app-switch-${app.id}`}
                togglePosition="right"
                isToggled={enabled}
                isDisabled={lockReason !== null}
                onToggle={(value) => setEnabled(backendId, app.id, value)}
              >
                <span className="font-medium text-contrast">{name}</span>
              </SettingsSwitch>
              <p className="text-xs text-tertiary-light">
                {t(app.descriptionKey)}
              </p>
              {lockReason ? (
                <p
                  data-testid={`built-in-app-lock-${app.id}`}
                  className="text-xs text-muted"
                >
                  {lockReason}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
