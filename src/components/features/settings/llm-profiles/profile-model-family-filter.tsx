import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import {
  ALL_MODEL_FAMILIES_KEY,
  type ModelFamily,
} from "#/utils/llm-profile-provider";
import { cn } from "#/utils/utils";

export interface ModelFamilyFilterItem {
  /** A {@link ModelFamily}, or {@link ALL_MODEL_FAMILIES_KEY}. */
  id: string;
  count: number;
}

interface ProfileModelFamilyFilterProps {
  items: ModelFamilyFilterItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}

// Brand names are not translated.
const MODEL_FAMILY_BRAND_LABELS: Partial<Record<ModelFamily, string>> = {
  claude: "Claude",
  openai: "OpenAI",
};

/**
 * Filter chips above the profile list that narrow it to one model family.
 * Filtering is by the model itself, so a Claude model routed through another
 * provider still shows under Claude.
 */
export function ProfileModelFamilyFilter({
  items,
  selectedId,
  onSelect,
}: ProfileModelFamilyFilterProps) {
  const { t } = useTranslation("openhands");

  const labelFor = (id: string) => {
    if (id === ALL_MODEL_FAMILIES_KEY) {
      return t(I18nKey.SETTINGS$PROFILE_MODEL_FAMILY_ALL);
    }
    if (id === "other") return t(I18nKey.SETTINGS$PROFILE_MODEL_FAMILY_OTHER);
    return MODEL_FAMILY_BRAND_LABELS[id as ModelFamily] ?? id;
  };

  return (
    <div
      role="group"
      aria-label={t(I18nKey.SETTINGS$PROFILE_MODEL_FAMILY_NAV)}
      data-testid="model-family-filter"
      className="flex flex-wrap items-center gap-2"
    >
      {items.map((item) => {
        const isSelected = item.id === selectedId;
        return (
          <button
            key={item.id}
            type="button"
            data-testid="model-family-filter-item"
            aria-pressed={isSelected}
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex h-8 items-center gap-2 rounded-full border px-3 text-sm transition-colors",
              isSelected
                ? "border-contrast bg-interactive-hover-low font-medium text-contrast"
                : "border-border text-muted hover:text-contrast",
            )}
          >
            <span>{labelFor(item.id)}</span>
            <span className="text-xs text-muted">{item.count}</span>
          </button>
        );
      })}
    </div>
  );
}
