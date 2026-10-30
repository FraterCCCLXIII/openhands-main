import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { extensionModuleCardPillClassName } from "#/utils/extension-module-card-classes";
import {
  licenseGroupOf,
  type AppPricing,
  type LicenseGroup,
} from "#/utils/canvas-app-catalog";

const usd = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: amount % 1 ? 2 : 0,
  }).format(amount);

/** The display price, e.g. "Free", "$5 one-time", "$10/month". */
export function usePriceText() {
  const { t } = useTranslation("openhands");
  return (pricing: AppPricing | null): string => {
    if (!pricing) return t(I18nKey.SETTINGS$APPS_PRICE_UNKNOWN);
    if (pricing.model === "free") return t(I18nKey.SETTINGS$APPS_PRICE_FREE);
    const price = usd(pricing.amount ?? 0);
    if (pricing.model === "one-time")
      return t(I18nKey.SETTINGS$APPS_PRICE_ONE_TIME_AMOUNT, { price });
    return t(
      pricing.period === "year"
        ? I18nKey.SETTINGS$APPS_PRICE_PER_YEAR
        : I18nKey.SETTINGS$APPS_PRICE_PER_MONTH,
      { price },
    );
  };
}

export const licenseGroupKeys: Record<LicenseGroup, I18nKey> = {
  "open-source": I18nKey.SETTINGS$APPS_LICENSE_OPEN_SOURCE,
  proprietary: I18nKey.SETTINGS$APPS_LICENSE_PROPRIETARY,
  other: I18nKey.SETTINGS$APPS_LICENSE_OTHER,
  unspecified: I18nKey.SETTINGS$APPS_LICENSE_UNSPECIFIED,
};

interface AppPriceChipsProps {
  pricing: AppPricing | null;
  license: string | null;
  testId: string;
}

/** Price badge, "Sample pricing" label (demo data only) and licence chip. */
export function AppPriceChips({
  pricing,
  license,
  testId,
}: AppPriceChipsProps) {
  const { t } = useTranslation("openhands");
  const priceText = usePriceText();
  return (
    <>
      <span
        data-testid={`${testId}-price`}
        className={extensionModuleCardPillClassName}
      >
        {priceText(pricing)}
      </span>
      {pricing?.sample ? (
        <span
          data-testid={`${testId}-sample-pricing`}
          className={extensionModuleCardPillClassName}
        >
          {t(I18nKey.SETTINGS$APPS_SAMPLE_PRICING)}
        </span>
      ) : null}
      <span
        data-testid={`${testId}-license`}
        className={extensionModuleCardPillClassName}
      >
        {license || t(licenseGroupKeys[licenseGroupOf(license)])}
      </span>
    </>
  );
}
