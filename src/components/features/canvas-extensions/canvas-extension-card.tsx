import { useTranslation } from "react-i18next";
import { BrandButton } from "#/components/features/settings/brand-button";
import { ToggleSwitch } from "#/ui/toggle-switch";
import { I18nKey } from "#/i18n/declaration";
import type { InstalledCanvasExtensionInfo } from "#/types/canvas-extension";
import { AppBanner } from "./app-banner";
import { Check, RefreshCw, Trash2 } from "lucide-react";
import { KebabMenu } from "#/components/features/automations/kebab-menu";
import { useDockedAppsStore } from "#/stores/docked-apps-store";
import { useNavigation } from "#/context/navigation-context";
import type { AppPricing } from "#/utils/canvas-app-catalog";
import { AppPriceChips } from "./app-price-chips";
import { extensionModuleCardPillClassName } from "#/utils/extension-module-card-classes";

interface CanvasExtensionCardProps {
  extension: InstalledCanvasExtensionInfo;
  isBusy: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onUninstall: () => void;
  onDetails: () => void;
  /** Where the app lives; absent while the app is off or has no page. */
  openHref?: string | null;
  pricing?: AppPricing | null;
  license?: string | null;
}

export function CanvasExtensionCard({
  extension,
  isBusy,
  onToggle,
  onRefresh,
  onUninstall,
  onDetails,
  openHref,
  pricing = null,
  license = null,
}: CanvasExtensionCardProps) {
  const { t } = useTranslation("openhands");
  const { navigate } = useNavigation();
  const docked = useDockedAppsStore((s) => !s.undocked[extension.name]);
  const setDocked = useDockedAppsStore((s) => s.setDocked);
  const pages = extension.manifest?.contributes?.pages ?? [];
  const displayName = extension.manifest?.display_name || extension.name;
  const description = extension.description || extension.manifest?.description;

  return (
    // The whole card opens the app for pointer users; keyboard users have the Open button.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <article
      data-testid={`canvas-extension-card-${extension.name}`}
      className={`flex min-w-0 flex-col overflow-hidden rounded-2xl bg-base-secondary ring-1 ring-white/5 ${openHref ? "cursor-pointer transition-colors hover:ring-white/15" : ""}`}
      onClick={(event) => {
        if (!openHref) return;
        if ((event.target as HTMLElement).closest("button, a, [role=switch]"))
          return;
        navigate(openHref);
      }}
    >
      <AppBanner
        name={extension.name}
        displayName={displayName}
        manifest={extension.manifest}
        className="h-36"
      >
        <ToggleSwitch
          enabled={extension.enabled}
          label={t(
            extension.enabled ? I18nKey.COMMON$DISABLE : I18nKey.COMMON$ENABLE,
          )}
          onToggle={onToggle}
          disabled={isBusy}
          className={`absolute top-3 right-3 ${isBusy ? "pointer-events-none opacity-50" : ""}`}
        />
      </AppBanner>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        <h3 className="truncate text-base font-semibold text-contrast">
          {displayName}
        </h3>
        {description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-tertiary-light">
            {description}
          </p>
        ) : null}

        <div className="mt-1 flex flex-wrap gap-1.5">
          <span className={extensionModuleCardPillClassName}>
            {extension.enabled
              ? t(I18nKey.SETTINGS$SKILLS_ENABLED)
              : t(I18nKey.SETTINGS$SKILLS_DISABLED)}
          </span>
          <span className={extensionModuleCardPillClassName}>
            {t(I18nKey.SETTINGS$SKILLS_VERSION, {
              version: extension.version,
            })}
          </span>
          <AppPriceChips
            pricing={pricing}
            license={license}
            testId={`canvas-extension-card-${extension.name}`}
          />
          {pages.length ? (
            <span className={extensionModuleCardPillClassName}>
              {t(I18nKey.SETTINGS$APPS_PAGES)}: {pages.length}
            </span>
          ) : null}
          {pages.map((page) => (
            <span key={page.id} className={extensionModuleCardPillClassName}>
              {page.title}
            </span>
          ))}
        </div>

        {extension.resolved_ref || extension.repo_path ? (
          <dl className="mt-1 grid min-w-0 grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
            {extension.resolved_ref ? (
              <>
                <dt className="text-tertiary-alt">
                  {t(I18nKey.SETTINGS$PLUGINS_REF_LABEL)}
                </dt>
                <dd className="min-w-0 truncate font-mono text-tertiary-light">
                  {extension.resolved_ref}
                </dd>
              </>
            ) : null}
            {extension.repo_path ? (
              <>
                <dt className="text-tertiary-alt">
                  {t(I18nKey.SETTINGS$PLUGINS_REPO_PATH_LABEL)}
                </dt>
                <dd className="min-w-0 truncate text-tertiary-light">
                  {extension.repo_path}
                </dd>
              </>
            ) : null}
          </dl>
        ) : null}
      </div>

      <footer className="flex items-center gap-2 px-4 pb-4">
        <BrandButton
          type="button"
          variant="primary"
          testId={`canvas-extension-open-${extension.name}`}
          isDisabled={!openHref}
          onClick={() => openHref && navigate(openHref)}
        >
          {t(I18nKey.SETTINGS$APPS_OPEN)}
        </BrandButton>
        <BrandButton
          type="button"
          variant="tertiary"
          testId={`canvas-extension-details-button-${extension.name}`}
          onClick={onDetails}
        >
          {t(I18nKey.SETTINGS$APPS_DETAILS)}
        </BrandButton>
        <KebabMenu
          triggerTestId={`canvas-extension-menu-${extension.name}`}
          items={[
            {
              label: t(I18nKey.SETTINGS$PLUGINS_REFRESH),
              icon: <RefreshCw />,
              disabled: isBusy,
              testId: `canvas-extension-refresh-${extension.name}`,
              onClick: onRefresh,
            },
            {
              label: t(I18nKey.SETTINGS$APPS_ADD_TO_DOCK),
              icon: docked ? <Check /> : <span className="size-4" />,
              testId: `canvas-extension-dock-${extension.name}`,
              onClick: () => setDocked(extension.name, !docked),
            },
            {
              label: t(I18nKey.SETTINGS$PLUGINS_UNINSTALL),
              icon: <Trash2 />,
              disabled: isBusy,
              testId: `canvas-extension-uninstall-${extension.name}`,
              onClick: onUninstall,
            },
          ]}
        />
      </footer>
    </article>
  );
}
