import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { lookupModelPrice } from "#/constants/model-prices";
import { formatPerMTok, formatPerToken } from "#/utils/model-price";

interface ProfilePriceProps {
  model: string | null | undefined;
}

/** Input / output list price per 1M tokens for a model, or "Price unknown". */
export function ProfilePrice({ model }: ProfilePriceProps) {
  const { t } = useTranslation("openhands");
  const price = lookupModelPrice(model);

  if (!price) {
    return (
      <span
        data-testid="profile-price-unknown"
        className="whitespace-nowrap text-xs text-muted"
        title={t(I18nKey.SETTINGS$MODEL_PRICE_UNKNOWN_TOOLTIP)}
      >
        {t(I18nKey.SETTINGS$MODEL_PRICE_UNKNOWN)}
      </span>
    );
  }

  const tooltip = [
    t(I18nKey.SETTINGS$MODEL_PRICE_TOOLTIP, {
      input: formatPerToken(price.inputPerMTok),
      output: formatPerToken(price.outputPerMTok),
    }),
    price.cachedPerMTok === undefined
      ? null
      : t(I18nKey.SETTINGS$MODEL_PRICE_TOOLTIP_CACHED, {
          cached: formatPerToken(price.cachedPerMTok),
        }),
    t(I18nKey.SETTINGS$MODEL_PRICE_TOOLTIP_SOURCE, {
      source: price.source,
      asOf: price.asOf,
    }),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <span
      data-testid="profile-price"
      className="whitespace-nowrap text-xs tabular-nums text-muted"
      title={tooltip}
    >
      {t(I18nKey.SETTINGS$MODEL_PRICE_LINE, {
        input: formatPerMTok(price.inputPerMTok),
        output: formatPerMTok(price.outputPerMTok),
      })}
    </span>
  );
}
