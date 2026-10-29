import React from "react";
import { useTranslation } from "react-i18next";
import { useChatInputLlmProfileState } from "#/hooks/use-chat-input-llm-profile-state";
import { ComboboxCaretInline } from "#/ui/combobox-caret";
import SettingsGearIcon from "#/icons/settings-gear.svg?react";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { NavigationLink } from "#/components/shared/navigation-link";
import { ContextMenu } from "#/ui/context-menu";
import { useCloseOnEscape } from "#/hooks/use-close-on-escape";
import {
  ChatInputLlmProfileBrowser,
  getProfileDisplayOverride,
} from "./chat-input-llm-profile-browser";
import { Divider } from "#/ui/divider";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { getLockedCloudHost } from "#/api/agent-server-config";
import {
  chatInputModelPillClassName,
  chatInputPillButtonClassName,
} from "#/utils/form-control-classes";
import { useFreeModels } from "#/hooks/query/use-free-models";
import { formatModelPrettyLabel } from "#/utils/format-model-name";
import { useModelCatalogWarning } from "#/hooks/use-model-catalog-warning";
import { ModelCatalogWarning } from "#/components/shared/model-catalog-warning";

const PROFILE_LABEL_MAX_CHARS = 18;

function truncateLabel(label: string): string {
  return label.length <= PROFILE_LABEL_MAX_CHARS
    ? label
    : `${label.slice(0, PROFILE_LABEL_MAX_CHARS)}…`;
}

interface ChatInputLlmProfileMenuContentProps {
  onClose: () => void;
  dividerInset?: "menu";
  settingsLinkClassName?: string;
  settingsIconClassName?: string;
}

/**
 * The in-conversation OpenHands LLM-profile switcher list. Selecting a profile
 * live-swaps the running conversation's LLM via `/switch_profile` (the ACP
 * analog is {@link ChatInputModelMenuContent}). Shared by the inline pill and
 * the chat-input overflow submenu.
 */
export function ChatInputLlmProfileMenuContent({
  onClose,
  dividerInset,
  settingsLinkClassName,
  settingsIconClassName,
}: ChatInputLlmProfileMenuContentProps) {
  const { t } = useTranslation("openhands");
  const freeModels = useFreeModels();
  const isModelUnlisted = useModelCatalogWarning();
  const {
    profiles,
    currentProfileName,
    currentProfileModel,
    canSwitchProfile,
    selectProfile,
  } = useChatInputLlmProfileState();
  // A read-only surface (a cloud start-task route) still names the active
  // profile — the same shape ChatInputModelMenuContent uses when the ACP
  // picker is gated off.
  const showProfileList = canSwitchProfile && profiles.length > 0;
  const readOnlyProfileName = canSwitchProfile ? null : currentProfileName;
  // Locked-to-Cloud blocks the Canvas LLM page this links to (OHE-3457).
  const showSettingsLink = getLockedCloudHost() === null;

  const handleSelect = (profileName: string) => {
    selectProfile(profileName);
    onClose();
  };

  return (
    <>
      {showProfileList && (
        <ChatInputLlmProfileBrowser
          profiles={profiles}
          currentProfileName={currentProfileName}
          freeModels={freeModels}
          onSelect={(profileName) => {
            if (profileName === currentProfileName) {
              onClose();
              return;
            }
            handleSelect(profileName);
          }}
        />
      )}
      {readOnlyProfileName && (
        <li className="text-sm" data-testid="chat-input-llm-profile-current">
          <div className="flex flex-col gap-0.5 p-2 leading-5 text-foreground">
            <span className="truncate" title={readOnlyProfileName}>
              {readOnlyProfileName}
            </span>
            {currentProfileModel && (
              <span className="truncate text-xs leading-4 text-muted">
                {formatModelPrettyLabel(currentProfileModel, freeModels)}
              </span>
            )}
            {isModelUnlisted(currentProfileModel) && <ModelCatalogWarning />}
          </div>
        </li>
      )}
      {showSettingsLink && (showProfileList || readOnlyProfileName) && (
        <Divider inset={dividerInset} />
      )}
      {showSettingsLink && (
        <li className="text-sm">
          <NavigationLink
            to="/settings/llm"
            onClick={onClose}
            className={cn(
              "flex min-h-9 items-center gap-2.5 rounded-md px-2.5 py-2 leading-5 text-foreground hover:bg-interactive-hover transition-colors",
              settingsLinkClassName,
            )}
          >
            <SettingsGearIcon
              width={16}
              height={16}
              className={cn("shrink-0", settingsIconClassName)}
              aria-hidden
            />
            <span>{t(I18nKey.SETTINGS$LLM_PROFILES)}</span>
          </NavigationLink>
        </li>
      )}
    </>
  );
}

export function ChatInputLlmProfilePicker() {
  const { t } = useTranslation("openhands");
  const {
    profiles,
    currentProfileName,
    currentProfileModel,
    isLoading,
    isSwitching,
    canSwitchProfile,
  } = useChatInputLlmProfileState();
  const isModelUnlisted = useModelCatalogWarning();
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [popoverMaxHeight, setPopoverMaxHeight] = React.useState<number>();
  const popoverRef = useClickOutsideElement<HTMLUListElement>(
    () => setIsPopoverOpen(false),
    triggerRef,
  );

  // The search field clears itself on the first Escape (preventDefault), which
  // this layer ignores; the next Escape closes the dropdown.
  useCloseOnEscape(isPopoverOpen, () => setIsPopoverOpen(false), triggerRef);

  React.useLayoutEffect(() => {
    if (!isPopoverOpen) return undefined;
    const measureAvailableSpace = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      // Leave room for the menu margin and an 8px viewport gutter.
      setPopoverMaxHeight(
        Math.max(
          0,
          Math.min(
            window.innerHeight * 0.6,
            trigger.getBoundingClientRect().top - 16,
          ),
        ),
      );
    };
    measureAvailableSpace();
    window.addEventListener("resize", measureAvailableSpace);
    window.addEventListener("scroll", measureAvailableSpace, true);
    return () => {
      window.removeEventListener("resize", measureAvailableSpace);
      window.removeEventListener("scroll", measureAvailableSpace, true);
    };
  }, [isPopoverOpen]);

  // Keep the chip visible while loading the list is pending or no LLM profile
  // exists yet; the placeholder label and menu still lead to LLM setup.
  if (isLoading) {
    return null;
  }

  const currentProfile = profiles.find((p) => p.name === currentProfileName);
  const label =
    (currentProfile
      ? formatModelPrettyLabel(
          currentProfile.model,
          undefined,
          getProfileDisplayOverride(currentProfile),
        )
      : null) ??
    currentProfileName ??
    t(I18nKey.LLM$SELECT_MODEL_PLACEHOLDER);

  return (
    <div className="relative min-w-0">
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          chatInputPillButtonClassName,
          chatInputModelPillClassName,
          "max-w-50",
        )}
        title={currentProfileModel ?? currentProfileName ?? undefined}
        data-testid="chat-input-llm-profile"
        aria-expanded={isPopoverOpen}
        aria-haspopup="dialog"
        // Disabled mid-switch so re-opening can't fire a second /switch_profile.
        disabled={isSwitching}
        aria-busy={isSwitching}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setIsPopoverOpen((open) => !open);
        }}
      >
        <span className="truncate">{truncateLabel(label)}</span>
        {isModelUnlisted(currentProfileModel) && (
          <ModelCatalogWarning compact />
        )}
        <ComboboxCaretInline isOpen={isPopoverOpen} />
      </button>

      {isPopoverOpen && (
        <ContextMenu
          ref={popoverRef}
          testId="chat-input-llm-profile-popover"
          style={{ maxHeight: popoverMaxHeight }}
          position="top"
          alignment="left"
          spacing="none"
          className={cn(
            "z-[60] mb-2 max-h-[60vh] overflow-y-auto p-0",
            canSwitchProfile ? "w-md max-w-screen" : "min-w-50 max-w-80",
          )}
        >
          <ChatInputLlmProfileMenuContent
            onClose={() => setIsPopoverOpen(false)}
          />
        </ContextMenu>
      )}
    </div>
  );
}
