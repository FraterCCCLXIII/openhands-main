import React from "react";
import { useTranslation } from "react-i18next";
import { Cpu } from "lucide-react";
import { AgentStatus } from "#/components/features/controls/agent-status";
import { ChangeAgentButton } from "../change-agent-button";
import { ChatInputAgentProfilePicker } from "./chat-input-profile-picker";
import { ChatInputModel, ChatInputModelMenuContent } from "./chat-input-model";
import {
  ChatInputLlmProfilePicker,
  ChatInputLlmProfileMenuContent,
} from "./chat-input-llm-profile-picker";
import { resolvePickerKind } from "./resolve-picker-kind";
import { ChatAddFileButton } from "../chat-add-file-button";
import { ChatSendButton } from "../chat-send-button";
import { ChatDictationButton } from "../chat-dictation-button";
import { ContextWindowMeter } from "./context-window-meter";
import CarretRightFillIcon from "#/icons/carret-right-fill.svg?react";
import ThreeDotsVerticalIcon from "#/icons/three-dots-vertical.svg?react";
import { useUnifiedPauseConversation } from "#/hooks/mutation/use-unified-stop-conversation";
import { useOptionalConversationId } from "#/hooks/use-conversation-id";
import { usePauseConversation } from "#/hooks/mutation/use-pause-conversation";
import { useResumeConversation } from "#/hooks/mutation/use-resume-conversation";
import { useActiveBackend } from "#/contexts/active-backend-context";
import { useAgentProfiles } from "#/hooks/query/use-agent-profiles";
import { useChatInputModelState } from "#/hooks/use-chat-input-model-state";
import { useChatInputLlmProfileState } from "#/hooks/use-chat-input-llm-profile-state";
import { getLockedCloudHost } from "#/api/agent-server-config";
import { I18nKey } from "#/i18n/declaration";
import { ToolsContextMenuIconText } from "../../controls/tools-context-menu-icon-text";
import { ContextMenuListItem } from "../../context-menu/context-menu-list-item";
import { ContextMenu } from "#/ui/context-menu";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { useCloseOnEscape } from "#/hooks/use-close-on-escape";
import { cn } from "#/utils/utils";
import { useComposerDockedMinimal } from "#/context/composer-docked-context";
import {
  chatInputIconButtonClassName,
  formControlTransitionClassName,
} from "#/utils/form-control-classes";
import { AppearancePortal } from "#/components/shared/appearance-portal";

interface ChatInputActionsProps {
  disabled: boolean;
  canSubmit?: boolean;
  hasStartedConversation?: boolean;
  onAddFileClick?: () => void;
  showButton?: boolean;
  buttonClassName?: string;
  handleSubmit?: () => void;
  onDictationTranscript?: (text: string) => void;
  /** Tracks the text field's editability, not submit availability. */
  isDictationDisabled?: boolean;
}

export function ChatInputActions({
  disabled,
  canSubmit = true,
  hasStartedConversation,
  onAddFileClick = () => {},
  showButton = true,
  buttonClassName = "",
  handleSubmit = () => {},
  onDictationTranscript,
  isDictationDisabled = false,
}: ChatInputActionsProps) {
  const { t } = useTranslation("openhands");
  const isComposerDockedMinimal = useComposerDockedMinimal();
  const unifiedPauseMutation = useUnifiedPauseConversation();
  const pauseConversationMutation = usePauseConversation();
  const resumeConversationMutation = useResumeConversation();
  const { conversationId } = useOptionalConversationId();
  const { backend } = useActiveBackend();
  const isCloud = backend.kind === "cloud";
  const modelState = useChatInputModelState();
  const llmProfileState = useChatInputLlmProfileState();
  // The agent-profile pill is visible in every conversation state whenever the
  // backend has profiles (#1571 fallback); it disables itself when switching is
  // not possible (see ChatInputAgentProfilePicker). Previously the pill shared
  // the "+" menu's pre-start gate, so it vanished once a conversation started.
  const agentProfiles = useAgentProfiles();
  const showAgentProfilePill = (agentProfiles.data?.profiles?.length ?? 0) > 0;
  // The "+" tools menu offers its own agent-profile entry (OSS-5735) only
  // while the conversation hasn't started. The gate is computed here (not in
  // the menu) so ToolsContextMenu only mounts the profile submenu when it can
  // actually be used: pre-start, not on a task route, with profiles.
  const isPreStart = !conversationId || hasStartedConversation === false;
  const showAgentProfileSwitch =
    isPreStart &&
    !(conversationId?.startsWith("task-") ?? false) &&
    showAgentProfilePill;
  // Code/Plan mode switching is a cloud OpenHands feature — it doesn't apply
  // to ACP conversations (which have no "plan" mode), so hide it when ACP.
  const showChangeAgentButton = isCloud && !modelState.isAcpContext;

  const actionsRowRef = React.useRef<HTMLDivElement>(null);
  const rightSectionRef = React.useRef<HTMLDivElement>(null);
  const addFileRef = React.useRef<HTMLDivElement>(null);
  const modelRef = React.useRef<HTMLDivElement>(null);
  const agentProfileRef = React.useRef<HTMLDivElement>(null);
  const overflowTriggerRef = React.useRef<HTMLButtonElement>(null);
  const [actionsRowWidth, setActionsRowWidth] = React.useState<number>(
    Number.POSITIVE_INFINITY,
  );
  const [rightSectionWidth, setRightSectionWidth] = React.useState(0);
  const [addFileWidth, setAddFileWidth] = React.useState(32);
  const [modelWidth, setModelWidth] = React.useState(120);
  const [agentProfileWidth, setAgentProfileWidth] = React.useState(110);
  const [isOverflowOpen, setIsOverflowOpen] = React.useState(false);
  const [activeSubmenu, setActiveSubmenu] = React.useState<"model" | null>(
    null,
  );
  const [overflowPortalStyle, setOverflowPortalStyle] =
    React.useState<React.CSSProperties>();

  React.useEffect(() => {
    const rowEl = actionsRowRef.current;
    const rightEl = rightSectionRef.current;
    const addEl = addFileRef.current;
    const modelEl = modelRef.current;
    const agentProfileEl = agentProfileRef.current;

    if (
      !rowEl ||
      !rightEl ||
      !addEl ||
      !modelEl ||
      typeof ResizeObserver === "undefined"
    ) {
      return;
    }

    const syncWidths = () => {
      const nextRowWidth = rowEl.getBoundingClientRect().width;
      const nextRightWidth = rightEl.getBoundingClientRect().width;
      const nextAddWidth = addEl.getBoundingClientRect().width;
      const nextModelWidth = modelEl.getBoundingClientRect().width;

      if (nextRowWidth > 0) setActionsRowWidth(nextRowWidth);
      if (nextRightWidth > 0) setRightSectionWidth(nextRightWidth);
      if (nextAddWidth > 0) setAddFileWidth(nextAddWidth);
      if (nextModelWidth > 0) setModelWidth(nextModelWidth);
      if (agentProfileEl) {
        const nextAgentWidth = agentProfileEl.getBoundingClientRect().width;
        if (nextAgentWidth > 0) setAgentProfileWidth(nextAgentWidth);
      }
    };

    const observer = new ResizeObserver(() => {
      syncWidths();
    });

    observer.observe(rowEl);
    observer.observe(rightEl);
    observer.observe(addEl);
    observer.observe(modelEl);
    if (agentProfileEl) {
      observer.observe(agentProfileEl);
    }

    syncWidths();

    return () => observer.disconnect();
  }, [showAgentProfilePill]);

  const handlePauseAgent = () => {
    if (!conversationId) return;
    pauseConversationMutation.mutate({ conversationId });
  };

  const handleResumeAgentClick = () => {
    if (!conversationId) return;
    resumeConversationMutation.mutate({ conversationId });
  };

  const isPausing =
    unifiedPauseMutation.isPending || pauseConversationMutation.isPending;

  const OVERFLOW_BUTTON_WIDTH = 28;
  const INLINE_GAP = 12;
  const ROOT_GAP = 8;

  const fitOptionalItems = React.useCallback(
    (availableWidth: number) => {
      const remaining = availableWidth;
      const next = {
        showModelInline: false,
      };

      if (remaining >= modelWidth) {
        next.showModelInline = true;
      }

      return next;
    },
    [modelWidth],
  );

  // The agent pill never moves to the overflow menu; it truncates instead, so
  // its width is reserved before the optional items are fitted.
  const agentProfileReserve = showAgentProfilePill
    ? agentProfileWidth + INLINE_GAP
    : 0;
  const leftBaseWidth =
    actionsRowWidth -
    rightSectionWidth -
    ROOT_GAP -
    addFileWidth -
    INLINE_GAP -
    agentProfileReserve;

  const fitWithoutOverflow = fitOptionalItems(leftBaseWidth);
  const allOptionalFit = fitWithoutOverflow.showModelInline;

  const fitWithOverflow = allOptionalFit
    ? fitWithoutOverflow
    : fitOptionalItems(leftBaseWidth - OVERFLOW_BUTTON_WIDTH - INLINE_GAP);

  const showModelInline = fitWithOverflow.showModelInline;
  const showAddFileInline = true;
  const showAgentStatusInline = actionsRowWidth >= 360;

  // Which chat-input LLM picker to show — the constrained ACP model picker or
  // the LLM-profile picker (unit-tested in `resolve-picker-kind.test.ts`).
  const pickerKind = resolvePickerKind({ isAcp: modelState.isAcpContext });

  // Locked-to-Cloud drops the settings link from the Model menu (OHE-3457),
  // so the overflow entry stays only while the menu still has rows — the same
  // conditions ChatInputModelMenuContent / ChatInputLlmProfileMenuContent use.
  const hasModelMenuRows =
    pickerKind === "model"
      ? modelState.showAcpPicker || Boolean(modelState.displayModel)
      : (llmProfileState.canSwitchProfile &&
          llmProfileState.profiles.length > 0) ||
        (!llmProfileState.canSwitchProfile &&
          Boolean(llmProfileState.currentProfileName));
  const showOverflowModel =
    !showModelInline && (getLockedCloudHost() === null || hasModelMenuRows);

  const hasOverflowItems = !showAddFileInline || showOverflowModel;

  React.useEffect(() => {
    if (!hasOverflowItems) {
      setIsOverflowOpen(false);
      setActiveSubmenu(null);
    }
  }, [hasOverflowItems]);

  // The trigger toggles the menu itself. The app hydrates on `document`, so
  // its stopPropagation() can't keep the click from this document listener;
  // without the ignore ref, the opening click immediately closes the menu.
  const overflowMenuRef = useClickOutsideElement<HTMLUListElement>(() => {
    setIsOverflowOpen(false);
    setActiveSubmenu(null);
  }, overflowTriggerRef);
  useCloseOnEscape(
    isOverflowOpen,
    () => {
      setIsOverflowOpen(false);
      setActiveSubmenu(null);
    },
    overflowTriggerRef,
  );

  const closeOverflowMenus = () => {
    setActiveSubmenu(null);
    setIsOverflowOpen(false);
  };

  // Shared styling for the settings link inside the overflow submenu content.
  const overflowSettingsLinkClassName = cn(
    "group",
    formControlTransitionClassName,
  );
  const overflowSettingsIconClassName = cn(
    "text-muted group-hover:text-foreground",
    formControlTransitionClassName,
  );

  React.useLayoutEffect(() => {
    if (!isOverflowOpen || !overflowTriggerRef.current) {
      return;
    }

    const trigger = overflowTriggerRef.current;

    const updatePosition = () => {
      const rect = trigger.getBoundingClientRect();
      const GAP = 8;
      setOverflowPortalStyle({
        position: "fixed",
        top: rect.top - GAP,
        left: rect.left,
        transform: "translateY(-100%)",
        zIndex: 9999,
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOverflowOpen]);

  const overflowMenu = (
    <ContextMenu
      ref={overflowMenuRef}
      testId="chat-input-overflow-menu"
      position="top"
      alignment="left"
      className="!static !top-auto !bottom-auto !left-auto !right-auto !mt-0 overflow-visible min-w-50"
    >
      {showOverflowModel && (
        <div className="relative group/overflow-model">
          <ContextMenuListItem
            testId="overflow-model-button"
            onClick={() =>
              setActiveSubmenu((current) =>
                current === "model" ? null : "model",
              )
            }
          >
            <ToolsContextMenuIconText
              icon={<Cpu width={16} height={16} strokeWidth={2} aria-hidden />}
              text={t(I18nKey.SETTINGS$AGENT_MODEL)}
              rightIcon={<CarretRightFillIcon width={10} height={10} />}
            />
          </ContextMenuListItem>
          <div
            className={cn(
              "absolute left-full top-[-4px] z-60 opacity-0 invisible pointer-events-none transition-all duration-200 ml-px",
              "group-hover/overflow-model:opacity-100 group-hover/overflow-model:visible group-hover/overflow-model:pointer-events-auto",
              "hover:opacity-100 hover:visible hover:pointer-events-auto",
              activeSubmenu === "model" &&
                "opacity-100 visible pointer-events-auto",
            )}
          >
            {/* overflow-y-auto (not overflow-visible) so a long ACP model list
                scrolls within the menu instead of overflowing the viewport.
                Safe because this menu has no floating children (tooltips /
                nested popovers) that would be clipped — only a flat model list
                + Settings link. Revisit if floating children are added here. */}
            <ContextMenu
              testId="overflow-model-submenu"
              className={cn(
                "max-h-[60vh] overflow-y-auto gap-0",
                pickerKind === "model"
                  ? "min-w-55 max-w-80"
                  : "w-md max-w-screen",
              )}
            >
              {pickerKind === "model" ? (
                <ChatInputModelMenuContent
                  model={modelState}
                  onClose={closeOverflowMenus}
                  dividerInset="menu"
                  settingsLinkClassName={overflowSettingsLinkClassName}
                  settingsIconClassName={overflowSettingsIconClassName}
                />
              ) : (
                <ChatInputLlmProfileMenuContent
                  onClose={closeOverflowMenus}
                  dividerInset="menu"
                  settingsLinkClassName={overflowSettingsLinkClassName}
                  settingsIconClassName={overflowSettingsIconClassName}
                />
              )}
            </ContextMenu>
          </div>
        </div>
      )}
    </ContextMenu>
  );

  if (isComposerDockedMinimal) {
    return (
      <div
        data-testid="chat-input-actions-minimal"
        className="w-full min-w-0 flex items-center justify-end gap-2"
      >
        {showButton ? (
          <ChatSendButton
            buttonClassName={buttonClassName}
            handleSubmit={handleSubmit}
            disabled={disabled || !canSubmit}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={actionsRowRef}
      className="w-full min-w-0 flex items-center justify-between gap-2"
    >
      <div className="flex min-w-0 items-center gap-1">
        <div className="flex min-w-0 items-center gap-3">
          <div ref={addFileRef} className={cn(!showAddFileInline && "hidden")}>
            <ChatAddFileButton
              disabled={disabled}
              handleFileIconClick={onAddFileClick}
              showAgentProfileSwitch={showAgentProfileSwitch}
            />
          </div>
          {/* The model pill and the agent-profile pill are separate pills side
              by side. The "+" menu keeps its own agent-profile entry (pre-start
              only) for widths where the model pill collapses into overflow. */}
          {showAgentProfilePill && (
            <div ref={agentProfileRef} className="min-w-0">
              <ChatInputAgentProfilePicker />
            </div>
          )}
          <div
            ref={modelRef}
            data-testid="chat-input-model-pill"
            className={cn("min-w-0", !showModelInline && "hidden")}
          >
            {/* Picker depends on backend + ACP context; see the
                `pickerKind` cases above. */}
            {pickerKind === "model" ? (
              <ChatInputModel />
            ) : (
              <ChatInputLlmProfilePicker />
            )}
          </div>

          {hasOverflowItems && (
            <div className="relative shrink-0">
              <button
                ref={overflowTriggerRef}
                type="button"
                className={cn(chatInputIconButtonClassName, "size-6")}
                aria-label={t(I18nKey.CHAT_INTERFACE$MORE_INPUT_ACTIONS)}
                aria-expanded={isOverflowOpen}
                aria-haspopup="menu"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setIsOverflowOpen((open) => !open);
                }}
              >
                <ThreeDotsVerticalIcon
                  width={16}
                  height={16}
                  color="currentColor"
                />
              </button>

              {isOverflowOpen &&
                typeof document !== "undefined" &&
                overflowPortalStyle && (
                  <AppearancePortal>
                    <div style={overflowPortalStyle}>{overflowMenu}</div>
                  </AppearancePortal>
                )}
            </div>
          )}
        </div>
      </div>
      <div
        ref={rightSectionRef}
        className="ml-auto flex shrink-0 items-center gap-2"
      >
        {showAgentStatusInline && conversationId && (
          <AgentStatus
            handleStop={handlePauseAgent}
            handleResumeAgent={handleResumeAgentClick}
            disabled={disabled}
            isPausing={isPausing}
          />
        )}
        {showChangeAgentButton && <ChangeAgentButton />}
        <ContextWindowMeter />
        {onDictationTranscript && (
          <ChatDictationButton
            onTranscript={onDictationTranscript}
            disabled={isDictationDisabled}
          />
        )}
        {showButton && (
          <ChatSendButton
            buttonClassName={buttonClassName}
            handleSubmit={handleSubmit}
            disabled={disabled || !canSubmit}
          />
        )}
      </div>
    </div>
  );
}
