import React from "react";
import { useTranslation } from "react-i18next";
import type { ProfileInfo } from "@openhands/typescript-client";
import CheckIcon from "#/icons/checkmark.svg?react";
import { ModelCatalogWarning } from "#/components/shared/model-catalog-warning";
import { useModelCatalogWarning } from "#/hooks/use-model-catalog-warning";
import { useProviderConnections } from "#/hooks/query/use-provider-connections";
import { I18nKey } from "#/i18n/declaration";
import { deriveProfileNameFromModel } from "#/utils/derive-profile-name";
import { dropdownMenuRowForegroundClassName } from "#/utils/dropdown-classes";
import {
  type FreeModelSet,
  formatModelPrettyLabel,
  formatProviderName,
  getModelProvider,
} from "#/utils/format-model-name";
import { cn } from "#/utils/utils";

const OPENHANDS_PROVIDER = "openhands";
/** Group key for profiles whose model carries no provider prefix. */
const OTHER_PROVIDER_KEY = "";

interface ProviderGroup {
  key: string;
  profiles: ProfileInfo[];
}

/**
 * The label a profile shows. A profile name the user chose (anything other than
 * the name auto-derived from its model) is the override; the profile schema has
 * no separate display-name field.
 */
export function getProfileDisplayOverride(profile: ProfileInfo): string | null {
  if (!profile.model) return profile.name;
  const derived = deriveProfileNameFromModel(profile.model);
  return profile.name.toLowerCase() === derived.toLowerCase()
    ? null
    : profile.name;
}

function groupConnectedProfiles(
  profiles: ProfileInfo[],
  connectedProviders: ReadonlySet<string>,
): ProviderGroup[] {
  const byKey = new Map<string, ProfileInfo[]>();
  profiles.forEach((profile) => {
    const provider = getModelProvider(profile.model);
    const isConnected =
      provider === OPENHANDS_PROVIDER ||
      (provider !== null && connectedProviders.has(provider)) ||
      profile.api_key_set ||
      profile.base_url !== null;
    if (!isConnected) return;
    const key = provider ?? OTHER_PROVIDER_KEY;
    byKey.set(key, [...(byKey.get(key) ?? []), profile]);
  });
  const rank = (key: string) => {
    if (key === OPENHANDS_PROVIDER) return 0;
    return key === OTHER_PROVIDER_KEY ? 2 : 1;
  };
  return [...byKey.entries()]
    .map(([key, groupProfiles]) => ({ key, profiles: groupProfiles }))
    .sort((a, b) => rank(a.key) - rank(b.key) || a.key.localeCompare(b.key));
}

interface ChatInputLlmProfileBrowserProps {
  profiles: ProfileInfo[];
  currentProfileName: string | null;
  freeModels: FreeModelSet;
  onSelect: (profileName: string) => void;
}

/**
 * Two-column LLM profile browser: connected providers on the left, the selected
 * provider's models on the right with a typeahead search on top. Focus stays in
 * the search field; arrow keys move through the visible models.
 */
export function ChatInputLlmProfileBrowser({
  profiles,
  currentProfileName,
  freeModels,
  onSelect,
}: ChatInputLlmProfileBrowserProps) {
  const { t } = useTranslation("openhands");
  const isModelUnlisted = useModelCatalogWarning();
  const { data: connections } = useProviderConnections();
  const listId = React.useId();
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [pickedProvider, setPickedProvider] = React.useState<string | null>(
    null,
  );
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const groups = React.useMemo(
    () =>
      groupConnectedProfiles(
        profiles,
        new Set((connections ?? []).map((c) => c.provider.toLowerCase())),
      ),
    [profiles, connections],
  );

  const currentGroupKey = groups.find((group) =>
    group.profiles.some((p) => p.name === currentProfileName),
  )?.key;
  const selectedGroup =
    groups.find((group) => group.key === pickedProvider) ??
    groups.find((group) => group.key === currentGroupKey) ??
    groups[0];

  const visibleProfiles = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const all = selectedGroup?.profiles ?? [];
    if (!needle) return all;
    return all.filter((profile) => {
      const label = formatModelPrettyLabel(
        profile.model,
        freeModels,
        getProfileDisplayOverride(profile),
      );
      return (
        (label ?? "").toLowerCase().includes(needle) ||
        (profile.model ?? "").toLowerCase().includes(needle)
      );
    });
  }, [selectedGroup, query, freeModels]);

  React.useEffect(() => {
    searchRef.current?.focus();
  }, []);

  // Land on the current model (or the first match) whenever the list changes.
  React.useEffect(() => {
    const currentIndex = query
      ? -1
      : visibleProfiles.findIndex((p) => p.name === currentProfileName);
    setActiveIndex(Math.max(currentIndex, 0));
  }, [visibleProfiles, query, currentProfileName]);

  const optionId = (profile: ProfileInfo) => `${listId}-${profile.name}`;
  const activeProfile = visibleProfiles[activeIndex];

  React.useEffect(() => {
    if (!activeProfile) return;
    document
      .getElementById(`${listId}-${activeProfile.name}`)
      ?.scrollIntoView?.({ block: "nearest" });
  }, [activeProfile, listId]);

  const providerLabel = (key: string) =>
    key === OTHER_PROVIDER_KEY
      ? t(I18nKey.CHAT$MODEL_PROVIDER_OTHER)
      : formatProviderName(key);

  const handleSearchKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      // Clear first; an unhandled Escape bubbles up and closes the dropdown.
      if (query) {
        event.preventDefault();
        setQuery("");
      }
      return;
    }
    if (visibleProfiles.length === 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(
        (index) =>
          (index + step + visibleProfiles.length) % visibleProfiles.length,
      );
    } else if (event.key === "Enter" && activeProfile) {
      event.preventDefault();
      onSelect(activeProfile.name);
    }
  };

  return (
    <li
      role="presentation"
      className="flex min-h-0 gap-1"
      data-testid="chat-input-llm-profile-browser"
    >
      <nav
        aria-label={t(I18nKey.CHAT$MODEL_PROVIDERS)}
        className="flex w-32 shrink-0 flex-col gap-0.5 border-r border-border-subtle pr-1"
      >
        {groups.map((group) => (
          <button
            key={group.key || "other"}
            type="button"
            data-testid={`chat-input-llm-provider-${group.key || "other"}`}
            aria-current={group.key === selectedGroup?.key || undefined}
            className={cn(
              dropdownMenuRowForegroundClassName,
              "truncate text-sm leading-5",
              group.key === selectedGroup?.key && "bg-interactive-hover",
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setPickedProvider(group.key);
              setQuery("");
              searchRef.current?.focus();
            }}
          >
            {providerLabel(group.key)}
          </button>
        ))}
      </nav>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <input
          ref={searchRef}
          type="text"
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-activedescendant={
            activeProfile ? optionId(activeProfile) : undefined
          }
          aria-label={t(I18nKey.CHAT$SEARCH_MODELS)}
          placeholder={t(I18nKey.CHAT$SEARCH_MODELS)}
          data-testid="chat-input-llm-model-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full rounded border border-border-subtle bg-transparent px-2 py-1 text-sm leading-5 text-foreground placeholder:text-text-dim focus:outline-none"
        />
        <div
          id={listId}
          role="listbox"
          className="flex max-h-64 flex-col gap-0.5 overflow-y-auto"
        >
          {visibleProfiles.length === 0 && (
            <p
              role="status"
              data-testid="chat-input-llm-model-empty"
              className="px-2 py-2 text-sm text-muted"
            >
              {t(I18nKey.COMMON$NO_RESULTS)}
            </p>
          )}
          {visibleProfiles.map((profile, index) => {
            const isCurrent = profile.name === currentProfileName;
            const override = getProfileDisplayOverride(profile);
            const label = formatModelPrettyLabel(
              profile.model,
              freeModels,
              override,
            );
            const subLabel = override
              ? formatModelPrettyLabel(profile.model, freeModels)
              : null;
            return (
              <button
                key={profile.name}
                id={optionId(profile)}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={isCurrent}
                data-testid={`chat-input-llm-profile-option-${profile.name}`}
                className={cn(
                  dropdownMenuRowForegroundClassName,
                  "flex flex-col items-stretch gap-0.5",
                  (isCurrent || index === activeIndex) &&
                    "bg-interactive-hover",
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onSelect(profile.name);
                }}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="flex-1 truncate text-sm leading-5"
                    title={profile.model ?? profile.name}
                  >
                    {label ?? profile.name}
                  </span>
                  {isCurrent && (
                    <CheckIcon
                      width={14}
                      height={14}
                      className="shrink-0"
                      aria-hidden
                    />
                  )}
                </span>
                {subLabel && (
                  <span className="block truncate text-xs leading-4 text-muted">
                    {subLabel}
                  </span>
                )}
                {isModelUnlisted(profile.model) && <ModelCatalogWarning />}
              </button>
            );
          })}
        </div>
      </div>
    </li>
  );
}
