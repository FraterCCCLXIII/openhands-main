import { useTranslation } from "react-i18next";
import { ProviderBrandMark } from "./provider-brand-mark";
import { I18nKey } from "#/i18n/declaration";
import { mapProvider } from "#/utils/map-provider";
import { cn } from "#/utils/utils";
import { settingsListScrollContainerClassName } from "#/utils/settings-list-classes";

export interface ProviderNavItem {
  /** Provider id, e.g. `anthropic` or `openai`. */
  id: string;
  /** Number of provider connections (accounts) already set up for it. */
  connectionCount: number;
}

interface ProviderNavProps {
  items: ProviderNavItem[];
  /** Opens the auth screen for the provider that was clicked. */
  onSelect: (id: string) => void;
}

/**
 * Left-hand list of the providers Canvas supports. Each row opens that
 * provider's auth screen (its connection form), so this nav is where accounts
 * get connected; it does not filter the profile list.
 */
export function ProviderNav({ items, onSelect }: ProviderNavProps) {
  const { t } = useTranslation("openhands");

  return (
    <nav
      aria-label={t(I18nKey.SETTINGS$PROFILE_PROVIDER_NAV)}
      data-testid="provider-nav"
      className={cn(
        settingsListScrollContainerClassName,
        "flex w-full shrink-0 flex-col p-1 md:w-56",
      )}
    >
      {items.map((item) => {
        const isConnected = item.connectionCount > 0;
        const label = mapProvider(item.id);
        return (
          <button
            key={item.id}
            type="button"
            data-testid="provider-nav-item"
            onClick={() => onSelect(item.id)}
            className="flex h-9 min-h-9 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-left text-sm text-muted transition-colors hover:bg-interactive-hover-low hover:text-contrast"
          >
            <ProviderBrandMark providerId={item.id} />
            <span className="min-w-0 flex-1 truncate" title={label}>
              {label}
            </span>
            <span
              className={cn(
                "shrink-0 text-xs",
                isConnected ? "text-contrast" : "text-muted",
              )}
            >
              {isConnected
                ? t(I18nKey.SETTINGS$PROVIDER_CONNECTED)
                : t(I18nKey.SETTINGS$PROVIDER_CONNECT)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
