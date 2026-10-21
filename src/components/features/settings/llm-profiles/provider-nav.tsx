import { useTranslation } from "react-i18next";
import { ProviderBrandMark } from "./provider-brand-mark";
import { I18nKey } from "#/i18n/declaration";
import {
  ALL_PROVIDERS_KEY,
  OTHER_PROVIDER_KEY,
} from "#/utils/llm-profile-provider";
import { mapProvider } from "#/utils/map-provider";
import { cn } from "#/utils/utils";
import { settingsListScrollContainerClassName } from "#/utils/settings-list-classes";

export interface ProviderNavItem {
  /** Provider id, or {@link ALL_PROVIDERS_KEY} / {@link OTHER_PROVIDER_KEY}. */
  id: string;
  count: number;
}

interface ProviderNavProps {
  items: ProviderNavItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ProviderNav({ items, selectedId, onSelect }: ProviderNavProps) {
  const { t } = useTranslation("openhands");

  const labelFor = (id: string) => {
    if (id === ALL_PROVIDERS_KEY)
      return t(I18nKey.SETTINGS$PROFILE_PROVIDER_ALL);
    if (id === OTHER_PROVIDER_KEY)
      return t(I18nKey.SETTINGS$PROFILE_PROVIDER_OTHER);
    return mapProvider(id);
  };

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
        const isSelected = item.id === selectedId;
        const label = labelFor(item.id);
        return (
          <button
            key={item.id}
            type="button"
            data-testid="provider-nav-item"
            aria-current={isSelected ? "true" : undefined}
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex h-9 min-h-9 shrink-0 items-center gap-2.5 rounded-md px-2.5 text-left text-sm transition-colors",
              isSelected
                ? "bg-interactive-hover-low font-medium text-contrast"
                : "text-muted hover:bg-interactive-hover-low hover:text-contrast",
            )}
          >
            {item.id === ALL_PROVIDERS_KEY ? null : (
              <ProviderBrandMark providerId={item.id} />
            )}
            <span className="min-w-0 flex-1 truncate" title={label}>
              {label}
            </span>
            <span className="shrink-0 text-xs text-muted">{item.count}</span>
          </button>
        );
      })}
    </nav>
  );
}
