import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import type { FeedMentionTarget } from "#/utils/feed-team-demo";

// The "@partial" at the end of the text, if the caret is still in one.
const OPEN_MENTION = /(^|\s)@(\w*)$/;

interface FeedThreadReplyBoxProps {
  /** Who is being replied to; their @handle starts the draft. */
  replyTo: FeedMentionTarget | { handle: string; name: string };
  targets: FeedMentionTarget[];
  onSubmit: (text: string) => void;
}

/** A reply input that suggests people to @mention as you type "@". */
export function FeedThreadReplyBox({
  replyTo,
  targets,
  onSubmit,
}: FeedThreadReplyBoxProps) {
  const { t } = useTranslation("openhands");
  const [text, setText] = useState(`@${replyTo.handle} `);
  const open = OPEN_MENTION.exec(text);
  const suggestions = open
    ? targets.filter((target) =>
        target.handle.toLowerCase().startsWith(open[2].toLowerCase()),
      )
    : [];

  const insert = (handle: string) =>
    setText((value) => value.replace(OPEN_MENTION, `$1@${handle} `));

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === `@${replyTo.handle}`) return;
    onSubmit(trimmed);
    setText("");
  };

  return (
    <div className="relative mt-2">
      <form
        data-testid="feed-thread-reply-form"
        className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <input
          data-testid="feed-thread-reply-input"
          // The reply box only mounts when the user asks to reply.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t(I18nKey.FEED$THREAD_REPLY_PLACEHOLDER, {
            name: replyTo.name,
          })}
          aria-label={t(I18nKey.FEED$THREAD_REPLY_PLACEHOLDER, {
            name: replyTo.name,
          })}
          className="min-w-0 flex-1 bg-transparent text-sm text-contrast outline-none placeholder:text-muted"
        />
        <button
          type="submit"
          data-testid="feed-thread-reply-send"
          aria-label={t(I18nKey.FEED$THREAD_REPLY)}
          className="text-muted hover:text-contrast"
        >
          <Send size={14} />
        </button>
      </form>
      {suggestions.length > 0 ? (
        <ul
          data-testid="feed-mention-suggestions"
          role="listbox"
          className="absolute bottom-full left-0 z-10 mb-1 min-w-44 rounded-xl border border-border-subtle bg-tertiary p-1 shadow-lg"
        >
          {suggestions.map((target) => (
            <li key={target.handle} role="option" aria-selected={false}>
              <button
                type="button"
                data-testid="feed-mention-suggestion"
                onClick={() => insert(target.handle)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-1 text-left text-sm text-contrast hover:bg-surface"
              >
                <span>{`@${target.handle}`}</span>
                <span className="text-xs text-muted">{target.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
