import { Plus, Search } from "lucide-react";
import { useProviderModels } from "#/hooks/query/use-provider-models";
import { useSaveLlmProfile } from "#/hooks/mutation/use-save-llm-profile";
import { ToggleSwitchVisual } from "#/ui/toggle-switch";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { useCloseOnEscape } from "#/hooks/use-close-on-escape";
import React from "react";
import { useTranslation } from "react-i18next";
import type { ProfileInfo } from "@openhands/typescript-client";
import CheckIcon from "#/icons/checkmark.svg?react";
import { ModelCatalogWarning } from "#/components/shared/model-catalog-warning";
import { useModelCatalogWarning } from "#/hooks/use-model-catalog-warning";
import { useProviderConnections } from "#/hooks/query/use-provider-connections";
import { useSearchProviders } from "#/hooks/query/use-search-providers";
import { useNavigation } from "#/context/navigation-context";
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
import { agentProfileAccentColor } from "./agent-profile-accent";
import { AgentBrandIcon } from "#/components/shared/agent-brand-icon";

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

/** Small provider-colored dot; the same provider always gets the same color. */
function ProviderDot({ providerKey }: { providerKey: string }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2 shrink-0 rounded-full"
      style={{
        backgroundColor: agentProfileAccentColor(providerKey || "other"),
      }}
    />
  );
}

/**
 * Square rounded tile for a provider tab, the same size as the agent drawer's
 * icon tiles. OpenHands shows its logo; other providers show an accent-colored
 * initial, since no provider logos ship with the app.
 */
function ProviderTile({
  providerKey,
  label,
}: {
  providerKey: string;
  label: string;
}) {
  if (providerKey === OPENHANDS_PROVIDER) {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-interactive-hover">
        <AgentBrandIcon kind="openhands" size={12} />
      </span>
    );
  }
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-interactive-hover">
      <span
        aria-hidden
        className="text-xs leading-none font-semibold"
        style={{ color: agentProfileAccentColor(providerKey || "other") }}
      >
        {label.charAt(0).toUpperCase()}
      </span>
    </span>
  );
}

/**
 * "+" beside the model search: opens a searchable list of the provider's models
 * that aren't added yet. Each row's toggle adds that model as a profile.
 */
function AddLlmModelButton({
  providerKey,
  existingModels,
}: {
  providerKey: string;
  existingModels: ReadonlySet<string>;
}) {
  const { t } = useTranslation("openhands");
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [savingModel, setSavingModel] = React.useState<string | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const close = React.useCallback(() => {
    setIsOpen(false);
    setQuery("");
  }, []);
  const popoverRef = useClickOutsideElement<HTMLDivElement>(close, triggerRef);
  useCloseOnEscape(isOpen, close, triggerRef);
  const { data: providerModels = [] } = useProviderModels(providerKey || null);
  const saveProfile = useSaveLlmProfile();

  const candidates = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const seen = new Set<string>();
    return providerModels
      .map((m) =>
        m.provider && !m.name.startsWith(`${m.provider}/`)
          ? `${m.provider}/${m.name}`
          : m.name,
      )
      .filter((full) => {
        if (seen.has(full) || existingModels.has(full)) return false;
        seen.add(full);
        return !needle || full.toLowerCase().includes(needle);
      });
  }, [providerModels, existingModels, query]);

  const addModel = async (model: string) => {
    setSavingModel(model);
    try {
      await saveProfile.mutateAsync({
        name: deriveProfileNameFromModel(model),
        request: { llm: { model }, include_secrets: false },
      });
    } catch {
      // The row stays in the list so the user can retry.
    } finally {
      setSavingModel(null);
    }
  };

  return (
    <div className="relative shrink-0">
      <StyledTooltip content={t(I18nKey.CHAT$ADD_MODEL)} placement="top">
        <button
          ref={triggerRef}
          type="button"
          aria-label={t(I18nKey.CHAT$ADD_MODEL)}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          data-testid="chat-input-llm-add-model"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setIsOpen((open) => !open);
          }}
          className="flex size-9 items-center justify-center rounded-md border border-border text-muted transition-colors hover:bg-interactive-hover hover:text-foreground"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </StyledTooltip>
      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          data-testid="chat-input-llm-add-model-popover"
          className="absolute top-full right-0 z-[70] mt-1 flex w-72 flex-col gap-2 rounded-xl border border-border-subtle bg-tertiary p-2 shadow-lg"
        >
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(I18nKey.CHAT$SEARCH_MODELS)}
            aria-label={t(I18nKey.CHAT$SEARCH_MODELS)}
            className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm leading-5 text-foreground placeholder:text-muted focus:outline-none"
          />
          <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto">
            {candidates.length === 0 && (
              <p className="px-2 py-2 text-sm text-muted">
                {t(I18nKey.CHAT$NO_MORE_MODELS)}
              </p>
            )}
            {candidates.map((full) => (
              <button
                key={full}
                type="button"
                role="switch"
                aria-checked={false}
                aria-label={full}
                disabled={savingModel !== null}
                onClick={() => void addModel(full)}
                className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-interactive-hover disabled:opacity-60"
              >
                <span className="truncate">{full}</span>
                <ToggleSwitchVisual enabled={savingModel === full} size="sm" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
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

  const existingModelIds = React.useMemo(
    () =>
      new Set(
        profiles.flatMap((profile) => (profile.model ? [profile.model] : [])),
      ),
    [profiles],
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

  // Supported providers without a connection get muted tabs; picking one shows
  // a connect pane instead of the model list.
  const { data: supportedProviders = [] } = useSearchProviders();
  const { navigate } = useNavigation();
  const connectedKeys = new Set(groups.map((group) => group.key));
  const unconnectedKeys = supportedProviders
    .map((provider) => provider.name.toLowerCase())
    .filter((key) => key !== OPENHANDS_PROVIDER && !connectedKeys.has(key));
  const isConnectPane =
    pickedProvider !== null && unconnectedKeys.includes(pickedProvider);
  const openLlmSettings = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    navigate("/settings/llm");
  };

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
      className="flex max-h-80 min-h-0 gap-1"
      data-testid="chat-input-llm-profile-browser"
    >
      <nav
        aria-label={t(I18nKey.CHAT$MODEL_PROVIDERS)}
        className="custom-scrollbar flex w-40 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border py-2 pr-2 pl-2"
      >
        {groups.map((group) => (
          <button
            key={group.key || "other"}
            type="button"
            data-testid={`chat-input-llm-provider-${group.key || "other"}`}
            aria-current={group.key === selectedGroup?.key || undefined}
            className={cn(
              dropdownMenuRowForegroundClassName,
              "flex items-center gap-2.5 truncate rounded-md px-2.5 py-2 text-sm leading-5",
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
            <ProviderTile
              providerKey={group.key}
              label={providerLabel(group.key)}
            />
            {providerLabel(group.key)}
          </button>
        ))}
        {unconnectedKeys.map((key) => (
          <button
            key={key}
            type="button"
            data-testid={`chat-input-llm-provider-${key}`}
            aria-current={
              (isConnectPane && pickedProvider === key) || undefined
            }
            className={cn(
              dropdownMenuRowForegroundClassName,
              "flex items-center gap-2.5 truncate rounded-md px-2.5 py-2 text-sm leading-5 text-muted",
              isConnectPane &&
                pickedProvider === key &&
                "bg-interactive-hover text-foreground",
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setPickedProvider(key);
              setQuery("");
            }}
          >
            <ProviderTile providerKey={key} label={providerLabel(key)} />
            {providerLabel(key)}
          </button>
        ))}
        <StyledTooltip
          content={t(I18nKey.SETTINGS$PROVIDER_CONNECTION_ADD)}
          placement="right"
        >
          <button
            type="button"
            aria-label={t(I18nKey.SETTINGS$PROVIDER_CONNECTION_ADD)}
            data-testid="chat-input-llm-provider-add"
            onClick={openLlmSettings}
            className="flex items-center justify-center rounded-md px-2.5 py-2 text-muted transition-colors hover:bg-interactive-hover hover:text-foreground"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </StyledTooltip>
      </nav>
      {isConnectPane ? (
        <div className="flex min-w-0 flex-1 flex-col items-start gap-3 p-2">
          <span className="text-sm font-medium text-foreground">
            {providerLabel(pickedProvider ?? "")}
          </span>
          <button
            type="button"
            data-testid="chat-input-llm-provider-connect"
            onClick={openLlmSettings}
            className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-interactive-hover"
          >
            {t(I18nKey.BACKEND$CONNECT)}
          </button>
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-2 p-2">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted"
              />
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
                className="w-full rounded-md border border-border bg-surface px-8 py-1.5 text-sm leading-5 text-foreground placeholder:text-muted transition-colors hover:border-contrast/25 focus:border-contrast/35 focus:outline-none"
              />
            </div>
            <AddLlmModelButton
              providerKey={selectedGroup?.key ?? ""}
              existingModels={existingModelIds}
            />
          </div>
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
                    <ProviderDot
                      providerKey={profile.model?.split("/")[0] ?? ""}
                    />
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
      )}
    </li>
  );
}
