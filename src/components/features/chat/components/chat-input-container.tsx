import React from "react";
import { DragOver } from "../drag-over";
import { UploadedFiles } from "../uploaded-files";
import { ChatInputRow } from "./chat-input-row";
import { ChatInputActions } from "./chat-input-actions";
import { SlashCommandMenu } from "./slash-command-menu";
import { useConversationStore } from "#/stores/conversation-store";
import { cn } from "#/utils/utils";
import { SlashCommandItem } from "#/hooks/chat/use-slash-command";
import { insertTextAtCaret } from "../utils/chat-input.utils";

interface ChatInputContainerProps {
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  isDragOver: boolean;
  disabled: boolean;
  canSubmit: boolean;
  hasStartedConversation?: boolean;
  isNewConversationPending?: boolean;
  showButton: boolean;
  buttonClassName: string;
  chatInputRef: React.RefObject<HTMLDivElement | null>;
  placeholder?: string;
  toolbarLeading?: React.ReactNode;
  hideProfilePickers?: boolean;
  handleFileIconClick: (isDisabled: boolean) => void;
  handleSubmit: () => void;
  onDragOver: (e: React.DragEvent, isDisabled: boolean) => void;
  onDragLeave: (e: React.DragEvent, isDisabled: boolean) => void;
  onDrop: (e: React.DragEvent, isDisabled: boolean) => void;
  onInput: () => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  isSlashMenuOpen?: boolean;
  slashItems?: SlashCommandItem[];
  slashSelectedIndex?: number;
  onSlashSelect?: (item: SlashCommandItem) => void;
}

export function ChatInputContainer({
  chatContainerRef,
  isDragOver,
  disabled,
  canSubmit,
  hasStartedConversation,
  isNewConversationPending = false,
  showButton,
  buttonClassName,
  chatInputRef,
  placeholder,
  toolbarLeading,
  hideProfilePickers,
  handleFileIconClick,
  handleSubmit,
  onDragOver,
  onDragLeave,
  onDrop,
  onInput,
  onPaste,
  onKeyDown,
  onFocus,
  onBlur,
  isSlashMenuOpen = false,
  slashItems = [],
  slashSelectedIndex = 0,
  onSlashSelect,
}: ChatInputContainerProps) {
  const conversationMode = useConversationStore(
    (state) => state.conversationMode,
  );

  return (
    <div
      ref={chatContainerRef}
      className={cn(
        "bg-linear-to-b from-surface to-background shadow-[0_10px_28px_-12px_rgba(0,0,0,0.45)] box-border content-stretch flex flex-col items-start justify-center p-4 relative z-20 rounded-[20px] ring-[0.5px] ring-inset ring-white/15 w-full animate-[composer-bubble-in_480ms_cubic-bezier(0.2,0.9,0.3,1)_both] motion-reduce:animate-none",
        conversationMode === "plan" && "border border-[#597FF4]",
      )}
      onDragOver={(e) => onDragOver(e, disabled)}
      onDragLeave={(e) => onDragLeave(e, disabled)}
      onDrop={(e) => onDrop(e, disabled)}
    >
      {/* Drag Over UI */}
      {isDragOver && <DragOver />}

      <UploadedFiles />

      {/* Wrapper so the slash menu anchors just above the input row,
          not above the entire (possibly resized) container */}
      <div className="relative w-full">
        {isSlashMenuOpen && onSlashSelect && (
          <SlashCommandMenu
            items={slashItems}
            selectedIndex={slashSelectedIndex}
            onSelect={onSlashSelect}
          />
        )}

        <ChatInputRow
          chatInputRef={chatInputRef}
          isNewConversationPending={isNewConversationPending}
          placeholder={placeholder}
          onInput={onInput}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>

      <ChatInputActions
        disabled={disabled}
        canSubmit={canSubmit}
        hasStartedConversation={hasStartedConversation}
        onAddFileClick={() => handleFileIconClick(disabled)}
        showButton={showButton}
        buttonClassName={buttonClassName}
        handleSubmit={handleSubmit}
        onDictationTranscript={(text) =>
          insertTextAtCaret(chatInputRef.current, text)
        }
        isDictationDisabled={isNewConversationPending}
        toolbarLeading={toolbarLeading}
        hideProfilePickers={hideProfilePickers}
      />
    </div>
  );
}
