import type React from "react";
import { useTranslation } from "react-i18next";
import { BrandButton } from "#/components/features/settings/brand-button";
import { ToggleSwitch } from "#/ui/toggle-switch";
import { I18nKey } from "#/i18n/declaration";
import type { InstalledCanvasExtensionInfo } from "#/types/canvas-extension";
import { CanvasExtensionIcon } from "./canvas-extension-icon";
import { canvasExtensionBannerUrl } from "#/utils/canvas-extension-banner";
import { extensionModuleCardPillClassName } from "#/utils/extension-module-card-classes";

interface CanvasExtensionCardProps {
  extension: InstalledCanvasExtensionInfo;
  isBusy: boolean;
  onToggle: () => void;
  onRefresh: () => void;
  onUninstall: () => void;
}

export function CanvasExtensionCard({
  extension,
  isBusy,
  onToggle,
  onRefresh,
  onUninstall,
}: CanvasExtensionCardProps) {
  const { t } = useTranslation("openhands");
  const pages = extension.manifest?.contributes?.pages ?? [];
  const displayName = extension.manifest?.display_name || extension.name;
  const description = extension.description || extension.manifest?.description;

  return (
    <article
      data-testid={`canvas-extension-card-${extension.name}`}
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-base-secondary ring-1 ring-white/5"
    >
      <div
        className="relative flex h-36 items-end bg-(image:--banner-url) bg-cover bg-center px-4 pb-4"
        style={
          {
            "--banner-url": `url("${canvasExtensionBannerUrl(extension.name)}")`,
          } as React.CSSProperties
        }
      >
        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 to-black/10" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-linear-to-b from-white/20 to-white/5 inset-shadow-xs inset-shadow-white/40 shadow-md shadow-black/20 ring-1 ring-white/10">
          <CanvasExtensionIcon extension={extension} size={36} />
        </div>
        <ToggleSwitch
          enabled={extension.enabled}
          label={t(
            extension.enabled ? I18nKey.COMMON$DISABLE : I18nKey.COMMON$ENABLE,
          )}
          onToggle={onToggle}
          disabled={isBusy}
          className={`absolute top-3 right-3 ${isBusy ? "pointer-events-none opacity-50" : ""}`}
        />
      </div>

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

      <footer className="flex justify-end gap-2 px-4 pb-4">
        <BrandButton
          type="button"
          variant="ghost-danger"
          className="no-underline"
          testId={`canvas-extension-uninstall-${extension.name}`}
          isDisabled={isBusy}
          onClick={onUninstall}
        >
          {t(I18nKey.SETTINGS$PLUGINS_UNINSTALL)}
        </BrandButton>
        <BrandButton
          type="button"
          variant="secondary"
          testId={`canvas-extension-refresh-${extension.name}`}
          isDisabled={isBusy}
          onClick={onRefresh}
        >
          {t(I18nKey.SETTINGS$PLUGINS_REFRESH)}
        </BrandButton>
      </footer>
    </article>
  );
}
