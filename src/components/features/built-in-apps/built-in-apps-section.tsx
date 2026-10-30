import { useTranslation } from "react-i18next";
import {
  BUILT_IN_APPS,
  type BuiltInApp,
  getBuiltInApp,
} from "#/built-in-apps/registry";
import { SettingsSwitch } from "#/components/features/settings/settings-switch";
import { I18nKey } from "#/i18n/declaration";
import {
  getEnabledDependents,
  isBuiltInAppEnabled,
  useBuiltInAppsBackendId,
  useBuiltInAppsStore,
} from "#/stores/built-in-apps-store";
import { StyledIcon } from "#/ui/styled-icon";
import { cn } from "#/utils/utils";

const TILE_SIZE = 40;
const GLYPH_SIZE = 22;

/**
 * The app's tile, drawn as in the sidebar: a coloured tile with a white glyph,
 * or a neutral tile whose glyph takes the text colour (muted when locked).
 */
function BuiltInAppTile({ app, muted }: { app: BuiltInApp; muted: boolean }) {
  const Icon = app.icon;
  if (app.tileBackground) {
    return (
      <StyledIcon
        size={TILE_SIZE}
        borderRadius={8}
        background={app.tileBackground}
      >
        <Icon width={GLYPH_SIZE} height={GLYPH_SIZE} />
      </StyledIcon>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-raised",
        muted ? "text-muted" : "text-contrast",
      )}
    >
      <Icon width={GLYPH_SIZE} height={GLYPH_SIZE} />
    </span>
  );
}

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
              className="flex items-center gap-3 px-4 py-3"
            >
              <span
                data-testid={`built-in-app-icon-${app.id}`}
                aria-hidden="true"
                className="shrink-0"
              >
                <BuiltInAppTile app={app} muted={lockReason !== null} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
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
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
