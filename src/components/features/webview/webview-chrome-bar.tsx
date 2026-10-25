import { ExternalLink, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

type WebviewChromeBarProps = {
  url: string;
  hasPage: boolean;
  onRefresh?: () => void;
};

export function WebviewChromeBar({
  url,
  hasPage,
  onRefresh,
}: WebviewChromeBarProps) {
  const { t } = useTranslation("openhands");

  const disabledButtonClassName = cn(
    "shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md",
    "text-text-tertiary opacity-40 cursor-not-allowed",
  );

  const iconClassName = "w-3.5 h-3.5";

  return (
    <div
      className="flex w-full min-h-8.5 shrink-0 items-center gap-1 border-b border-border px-2 py-1.5"
      data-testid="webview-chrome-bar"
    >
      {hasPage && onRefresh ? (
        <button
          type="button"
          onClick={onRefresh}
          aria-label={t(I18nKey.BUTTON$REFRESH)}
          title={t(I18nKey.BUTTON$REFRESH)}
          data-testid="webview-chrome-refresh"
          className={cn(
            "shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md",
            "text-text-tertiary hover:bg-tertiary cursor-pointer",
          )}
        >
          <RefreshCw className={iconClassName} aria-hidden strokeWidth={2} />
        </button>
      ) : (
        <button
          type="button"
          disabled
          aria-label={t(I18nKey.BUTTON$REFRESH)}
          title={t(I18nKey.BUTTON$REFRESH)}
          className={disabledButtonClassName}
        >
          <RefreshCw className={iconClassName} aria-hidden strokeWidth={2} />
        </button>
      )}

      <div
        className={cn(
          "flex min-h-7 min-w-0 flex-1 items-center rounded-md border border-border",
          "bg-surface-raised px-2 text-xs leading-5",
          url ? "text-text-tertiary" : "text-text-dim",
        )}
        data-testid="webview-chrome-url"
        title={url || undefined}
      >
        <span className="truncate">
          {url || t(I18nKey.BROWSER$URL_PLACEHOLDER)}
        </span>
      </div>

      {hasPage && url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t(I18nKey.BUTTON$OPEN_IN_NEW_TAB)}
          title={t(I18nKey.BUTTON$OPEN_IN_NEW_TAB)}
          data-testid="webview-chrome-open-external"
          className={cn(
            "shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-md",
            "text-text-tertiary hover:bg-tertiary cursor-pointer",
          )}
        >
          <ExternalLink className={iconClassName} aria-hidden strokeWidth={2} />
        </a>
      ) : (
        <button
          type="button"
          disabled
          aria-label={t(I18nKey.BUTTON$OPEN_IN_NEW_TAB)}
          title={t(I18nKey.BUTTON$OPEN_IN_NEW_TAB)}
          className={disabledButtonClassName}
        >
          <ExternalLink className={iconClassName} aria-hidden strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
