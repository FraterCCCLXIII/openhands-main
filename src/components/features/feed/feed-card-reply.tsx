import { useRef, useState, type ClipboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Paperclip, SendHorizontal, X } from "lucide-react";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { FEED_QUERY_KEYS } from "#/hooks/query/query-keys";
import { I18nKey } from "#/i18n/declaration";
import { isMissingSandboxStatus } from "#/utils/conversation-archive-status";
import { displayErrorToast } from "#/utils/custom-toast-handlers";
import { getApiErrorMessage } from "#/utils/api-error-message";
import { sendMessageWithAttachments } from "#/utils/send-message-with-attachments";

// Prefixes of the cached queries a sent message makes stale.
const CONVERSATIONS_QUERY_KEY = ["user", "conversations"] as const;
const METRICS_QUERY_KEY = ["conversation-metrics"] as const;

const MAX_INPUT_HEIGHT_PX = 120;

/**
 * Compact composer on a feed card: grows with its text, takes attachments
 * (button or paste) and sends to that conversation's agent. It keeps its own
 * state rather than the shared chat-input store, so many can sit in one feed.
 */
export function FeedCardReply({
  conversation,
}: {
  conversation: AppConversation;
}) {
  const { t } = useTranslation("openhands");
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const unavailable = isMissingSandboxStatus(conversation.sandbox_status);
  const trimmed = text.trim();
  const canSend =
    (!!trimmed || attachments.length > 0) && !isSending && !unavailable;

  const resize = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.setProperty("height", "auto");
    el.style.setProperty(
      "height",
      `${Math.min(el.scrollHeight, MAX_INPUT_HEIGHT_PX)}px`,
    );
  };

  const addFiles = (incoming: File[]) => {
    if (incoming.length > 0) {
      setAttachments((current) => [...current, ...incoming]);
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = Array.from(event.clipboardData.files);
    if (pasted.length > 0) {
      event.preventDefault();
      addFiles(pasted);
    }
  };

  const send = async () => {
    if (!canSend) return;
    setIsSending(true);
    try {
      await sendMessageWithAttachments({
        conversationId: conversation.id,
        content: trimmed,
        images: attachments.filter((file) => file.type.startsWith("image/")),
        files: attachments.filter((file) => !file.type.startsWith("image/")),
        imagesMarkedUploadAsFile: [],
        t,
      });
      setText("");
      setAttachments([]);
      requestAnimationFrame(resize);
      // Pull the new message, status and usage into the card right away.
      void queryClient.invalidateQueries({ queryKey: FEED_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: METRICS_QUERY_KEY });
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "";
      displayErrorToast(getApiErrorMessage(error, fallback) || null);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form
      data-testid="feed-card-reply"
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        void send();
      }}
    >
      {attachments.length > 0 ? (
        <ul
          data-testid="feed-card-reply-attachments"
          className="flex flex-wrap gap-1"
        >
          {attachments.map((file, index) => (
            <li
              key={`${file.name}:${index}`}
              className="flex max-w-40 items-center gap-1 rounded-full bg-surface px-3 py-1 text-xs text-muted"
            >
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                aria-label={t(I18nKey.FEED$REMOVE_ATTACHMENT)}
                onClick={() =>
                  setAttachments((current) =>
                    current.filter((_, i) => i !== index),
                  )
                }
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          data-testid="feed-card-reply-file-input"
          onChange={(event) => {
            const input = event.target;
            addFiles(Array.from(input.files ?? []));
            input.value = "";
          }}
        />
        <button
          type="button"
          disabled={unavailable}
          aria-label={t(I18nKey.FEED$ATTACH)}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 text-muted transition-colors hover:text-contrast disabled:opacity-50"
        >
          <Paperclip size={18} />
        </button>
        <textarea
          ref={inputRef}
          data-testid="feed-card-reply-input"
          rows={1}
          value={text}
          disabled={unavailable}
          placeholder={t(I18nKey.FEED$REPLY_PLACEHOLDER)}
          aria-label={t(I18nKey.FEED$REPLY_PLACEHOLDER)}
          onChange={(event) => {
            setText(event.target.value);
            resize();
          }}
          onPaste={handlePaste}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          className="min-w-0 flex-1 resize-none bg-transparent text-sm text-contrast outline-none placeholder:text-muted disabled:opacity-50"
        />
        <button
          type="submit"
          data-testid="feed-card-reply-send"
          disabled={!canSend}
          aria-label={t(I18nKey.FEED$SEND)}
          className="shrink-0 text-muted transition-colors hover:text-contrast disabled:opacity-50"
        >
          <SendHorizontal size={18} />
        </button>
      </div>
    </form>
  );
}
