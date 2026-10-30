import { useTranslation } from "react-i18next";
import { BrandButton } from "#/components/features/settings/brand-button";
import { I18nKey } from "#/i18n/declaration";
import { useInstallCanvasExtension } from "#/hooks/mutation/use-manage-canvas-extensions";
import { extensionModuleCardPillClassName } from "#/utils/extension-module-card-classes";
import {
  installRequestFor,
  priceValueOf,
  type AppEntry,
} from "#/utils/canvas-app-catalog";
import { AppBanner } from "./app-banner";
import { AppPriceChips, usePriceText } from "./app-price-chips";

/** A catalog entry in the App Store view. Paid apps cannot be installed: no payments exist. */
export function AppStoreCard({ entry }: { entry: AppEntry }) {
  const { t } = useTranslation("openhands");
  const install = useInstallCanvasExtension();
  const priceText = usePriceText();
  const testId = `app-store-card-${entry.name}`;
  const isPaid = (priceValueOf(entry.pricing) ?? 0) > 0;
  const reasonId = `${testId}-paid-reason`;

  let action: React.ReactNode;
  if (entry.installed) {
    action = (
      <span className={extensionModuleCardPillClassName}>
        {t(
          entry.installed.enabled
            ? I18nKey.SETTINGS$SKILLS_ENABLED
            : I18nKey.SETTINGS$SKILLS_DISABLED,
        )}
      </span>
    );
  } else if (isPaid && entry.pricing) {
    action = (
      <>
        <span title={t(I18nKey.SETTINGS$APPS_PAID_UNAVAILABLE)}>
          <BrandButton
            type="button"
            variant="secondary"
            isDisabled
            testId={`${testId}-get`}
            ariaLabel={`${t(I18nKey.SETTINGS$APPS_GET_FOR, { price: priceText(entry.pricing) })}. ${t(I18nKey.SETTINGS$APPS_PAID_UNAVAILABLE)}`}
          >
            {t(I18nKey.SETTINGS$APPS_GET_FOR, {
              price: priceText(entry.pricing),
            })}
          </BrandButton>
        </span>
        <span id={reasonId} className="text-xs text-tertiary-light">
          {t(I18nKey.SETTINGS$APPS_PAID_UNAVAILABLE)}
        </span>
        {entry.contactUrl ? (
          <a
            href={entry.contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline"
          >
            {t(I18nKey.SETTINGS$APPS_CONTACT_PUBLISHER)}
          </a>
        ) : null}
      </>
    );
  } else {
    action = (
      <BrandButton
        type="button"
        variant="primary"
        testId={`${testId}-install`}
        isDisabled={install.isPending || !entry.known}
        onClick={() =>
          entry.known && install.mutate(installRequestFor(entry.known))
        }
      >
        {t(
          install.isPending
            ? I18nKey.SETTINGS$PLUGINS_INSTALLING
            : I18nKey.SETTINGS$PLUGINS_INSTALL,
        )}
      </BrandButton>
    );
  }

  return (
    <article
      data-testid={testId}
      className="flex min-w-0 flex-col overflow-hidden rounded-2xl bg-base-secondary ring-1 ring-white/5"
    >
      <AppBanner
        name={entry.name}
        displayName={entry.label}
        manifest={entry.installed?.manifest}
        className="h-24"
      />
      <div className="flex min-w-0 flex-col gap-2 p-4">
        <h3 className="truncate text-base font-semibold text-contrast">
          {entry.label}
        </h3>
        {entry.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-tertiary-light">
            {entry.description}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          <AppPriceChips
            pricing={entry.pricing}
            license={entry.license}
            testId={testId}
          />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">{action}</div>
      </div>
    </article>
  );
}
