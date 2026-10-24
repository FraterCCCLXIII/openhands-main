import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  ArrowUpFromLine,
  GitCommitHorizontal,
  GitPullRequest,
  MoreHorizontal,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { ContextMenuListItem } from "#/components/features/context-menu/context-menu-list-item";
import { ConfirmArchiveModal } from "#/components/features/conversation-panel/confirm-archive-modal";
import { ConfirmDeleteModal } from "#/components/features/conversation-panel/confirm-delete-modal";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { useDeleteConversation } from "#/hooks/mutation/use-delete-conversation";
import { useFeedConversationFlags } from "#/hooks/use-feed-conversation-flags";
import { FEED_QUERY_KEYS } from "#/hooks/query/query-keys";
import { I18nKey } from "#/i18n/declaration";
import { ContextMenu } from "#/ui/context-menu";
import { Divider } from "#/ui/divider";
import { isMissingSandboxStatus } from "#/utils/conversation-archive-status";
import { displayErrorToast } from "#/utils/custom-toast-handlers";
import { getApiErrorMessage } from "#/utils/api-error-message";
import { getGitCommitPrompt } from "#/utils/feed-git-prompts";
import { sendMessageWithAttachments } from "#/utils/send-message-with-attachments";
import { getCreatePRPrompt, getGitPushPrompt } from "#/utils/utils";

const ICON_SIZE = 14;
const DEFAULT_GIT_PROVIDER = "github";

type PendingConfirm = "archive" | "delete" | null;

function MenuRow({
  icon,
  label,
  onClick,
  disabled,
  testId,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  testId: string;
}) {
  return (
    <ContextMenuListItem
      testId={testId}
      isDisabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
    </ContextMenuListItem>
  );
}

/** Three-dot menu on a feed card: commit actions, pin, archive and delete. */
export function FeedCardMenu({
  conversation,
}: {
  conversation: AppConversation;
}) {
  const { t } = useTranslation("openhands");
  const queryClient = useQueryClient();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<PendingConfirm>(null);
  const flags = useFeedConversationFlags(conversation.id);
  const { mutate: deleteConversation } = useDeleteConversation();
  const menuRef = useClickOutsideElement<HTMLUListElement>(
    () => setOpen(false),
    triggerRef,
  );

  const hasWorkspace =
    !!conversation.selected_repository ||
    !!conversation.workspace?.working_dir?.trim();
  const gitDisabled =
    !hasWorkspace || isMissingSandboxStatus(conversation.sandbox_status);
  const provider = conversation.git_provider ?? DEFAULT_GIT_PROVIDER;

  const sendPrompt = async (prompt: string) => {
    setOpen(false);
    try {
      await sendMessageWithAttachments({
        conversationId: conversation.id,
        content: prompt,
        images: [],
        files: [],
        imagesMarkedUploadAsFile: [],
        t,
      });
      void queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEYS.all });
      void queryClient.invalidateQueries({
        queryKey: ["user", "conversations"],
      });
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "";
      displayErrorToast(getApiErrorMessage(error, fallback) || null);
    }
  };

  return (
    <div ref={triggerRef} className="relative">
      <button
        type="button"
        data-testid="feed-card-menu-trigger"
        aria-label={t(I18nKey.FEED$MORE_ACTIONS)}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="rounded-full p-2 text-muted hover:bg-surface hover:text-contrast"
      >
        <MoreHorizontal size={16} />
      </button>
      {open ? (
        <ContextMenu
          ref={menuRef}
          testId="feed-card-menu"
          alignment="right"
          position="bottom"
          className="min-w-52"
        >
          <MenuRow
            testId="feed-card-menu-commit"
            icon={<GitCommitHorizontal size={ICON_SIZE} />}
            label={t(I18nKey.FEED$COMMIT_CHANGES)}
            disabled={gitDisabled}
            onClick={() => void sendPrompt(getGitCommitPrompt())}
          />
          <MenuRow
            testId="feed-card-menu-push"
            icon={<ArrowUpFromLine size={ICON_SIZE} />}
            label={t(I18nKey.COMMON$PUSH)}
            disabled={gitDisabled}
            onClick={() => void sendPrompt(getGitPushPrompt(provider))}
          />
          <MenuRow
            testId="feed-card-menu-pr"
            icon={<GitPullRequest size={ICON_SIZE} />}
            label={t(I18nKey.COMMON$CREATE_PR)}
            disabled={gitDisabled}
            onClick={() => void sendPrompt(getCreatePRPrompt(provider))}
          />
          <Divider inset="menu" />
          <MenuRow
            testId="feed-card-menu-pin"
            icon={
              flags.isPinned ? (
                <PinOff size={ICON_SIZE} />
              ) : (
                <Pin size={ICON_SIZE} />
              )
            }
            label={t(
              flags.isPinned
                ? I18nKey.CONVERSATION_PANEL$UNPIN_CONVERSATION
                : I18nKey.CONVERSATION_PANEL$PIN_CONVERSATION,
            )}
            onClick={() => {
              flags.togglePin();
              setOpen(false);
            }}
          />
          <MenuRow
            testId="feed-card-menu-archive"
            icon={
              flags.isArchived ? (
                <ArchiveRestore size={ICON_SIZE} />
              ) : (
                <Archive size={ICON_SIZE} />
              )
            }
            label={t(
              flags.isArchived
                ? I18nKey.COMMON$UNARCHIVE_CONVERSATION
                : I18nKey.COMMON$ARCHIVE_CONVERSATION,
            )}
            onClick={() => {
              setOpen(false);
              if (flags.isArchived) flags.unarchive();
              else setConfirm("archive");
            }}
          />
          <MenuRow
            testId="feed-card-menu-delete"
            icon={<Trash2 size={ICON_SIZE} />}
            label={t(I18nKey.COMMON$DELETE_CONVERSATION)}
            onClick={() => {
              setOpen(false);
              setConfirm("delete");
            }}
          />
        </ContextMenu>
      ) : null}

      {confirm === "archive" ? (
        <ConfirmArchiveModal
          conversationTitle={conversation.title ?? ""}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            flags.archive();
            setConfirm(null);
          }}
        />
      ) : null}
      {confirm === "delete" ? (
        <ConfirmDeleteModal
          conversationTitle={conversation.title ?? ""}
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            deleteConversation(
              { conversationId: conversation.id },
              {
                onSuccess: () => {
                  flags.unpin();
                  flags.unarchive();
                  void queryClient.invalidateQueries({
                    queryKey: ["user", "conversations"],
                  });
                },
              },
            );
            setConfirm(null);
          }}
        />
      ) : null}
    </div>
  );
}
