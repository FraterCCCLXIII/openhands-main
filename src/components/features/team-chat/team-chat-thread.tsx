import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TeamClient, TeamMessage } from "#/chat-transport/nostr";
import { CustomChatInput } from "#/components/features/chat/custom-chat-input";
import { I18nKey } from "#/i18n/declaration";
import { mentionedPubkeys } from "#/utils/team-chat-inbox";
import { cn } from "#/utils/utils";
import { ErrorNote, Initials } from "./team-chat-ui";

const MAX_INDENT = 3;
const MENTION_AT_END = /(^|\s)@([^\s@]*)$/;

function MessageRow({
  message,
  client,
  depth,
  replies,
  onReply,
}: {
  message: TeamMessage;
  client: TeamClient;
  depth: number;
  replies: Map<string, TeamMessage[]>;
  onReply: (m: TeamMessage) => void;
}) {
  const { t } = useTranslation("openhands");
  const author = client.members().find((m) => m.pubkey === message.pubkey);
  const isAgent = author?.kind === "agent";
  return (
    <li className={cn(depth > 0 && depth <= MAX_INDENT && "ml-8")}>
      <div data-testid="team-message" className="flex gap-3 py-2">
        <Initials name={client.nameOf(message.pubkey)} agent={isAgent} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="text-sm font-medium text-contrast">
              {client.nameOf(message.pubkey)}
            </span>
            {isAgent && (
              <span className="rounded-full bg-surface-raised px-2 py-0.5">
                {t(I18nKey.TEAM_CHAT$AGENT)}
              </span>
            )}
            <time>
              {new Date(message.createdAt * 1000).toLocaleTimeString()}
            </time>
          </div>
          <p className="whitespace-pre-wrap break-words text-sm text-foreground">
            {message.text}
          </p>
          <button
            type="button"
            className="text-xs text-muted hover:text-contrast"
            onClick={() => onReply(message)}
          >
            {t(I18nKey.TEAM_CHAT$REPLY)}
          </button>
        </div>
      </div>
      {(replies.get(message.id) ?? []).length > 0 && (
        <ul>
          {(replies.get(message.id) ?? []).map((child) => (
            <MessageRow
              key={child.id}
              message={child}
              client={client}
              depth={depth + 1}
              replies={replies}
              onReply={onReply}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function MentionPicker({
  client,
  query,
  onPick,
}: {
  client: TeamClient;
  query: string;
  onPick: (name: string) => void;
}) {
  const { t } = useTranslation("openhands");
  const matches = client
    .members()
    .filter(
      (m) =>
        m.pubkey !== client.account.pubkey &&
        m.name.toLowerCase().includes(query.toLowerCase()),
    );
  if (matches.length === 0) return null;
  return (
    <ul
      aria-label={t(I18nKey.TEAM_CHAT$MENTION)}
      className="custom-scrollbar absolute bottom-full left-0 mb-2 max-h-48 w-64 overflow-y-auto rounded-lg border border-border bg-surface-raised p-1"
    >
      {matches.map((m) => (
        <li key={m.pubkey}>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-surface"
            onClick={() => onPick(m.name)}
          >
            <Initials name={m.name} agent={m.kind === "agent"} />
            {m.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function TeamComposer({
  client,
  replyTo,
  onClearReply,
}: {
  client: TeamClient;
  replyTo: TeamMessage | null;
  onClearReply: () => void;
}) {
  const { t } = useTranslation("openhands");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  const editor = () =>
    wrapperRef.current?.querySelector<HTMLElement>('[contenteditable="true"]');

  const onInput = () => {
    const match = MENTION_AT_END.exec(editor()?.innerText ?? "");
    setQuery(match ? match[2] : null);
  };

  const pick = (name: string) => {
    const el = editor();
    if (!el) return;
    el.innerText = el.innerText.replace(MENTION_AT_END, `$1@${name} `);
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    window.getSelection()?.removeAllRanges();
    window.getSelection()?.addRange(range);
    el.focus();
    setQuery(null);
  };

  const submit = (message: string) => {
    const text = message.trim();
    if (!text) return;
    setError(null);
    client
      .post(text, {
        parent: replyTo?.id,
        mentions: mentionedPubkeys(text, client.members()),
      })
      .then(onClearReply)
      .catch(setError);
  };

  return (
    <div className="border-t border-border px-4 py-3">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2">
        {replyTo && (
          <div className="flex items-center gap-2 text-xs text-muted">
            {t(I18nKey.TEAM_CHAT$REPLYING_TO, {
              name: client.nameOf(replyTo.pubkey),
            })}
            <button
              type="button"
              className="hover:text-contrast"
              onClick={onClearReply}
            >
              {t(I18nKey.TEAM_CHAT$CANCEL)}
            </button>
          </div>
        )}
        <ErrorNote error={error} />
        {/* The input is a contenteditable; this wrapper watches it for a trailing @. */}
        {}
        <div ref={wrapperRef} className="relative" onInput={onInput}>
          {query !== null && (
            <MentionPicker client={client} query={query} onPick={pick} />
          )}
          <CustomChatInput
            onSubmit={submit}
            persistDraft={false}
            placeholder={t(I18nKey.TEAM_CHAT$COMPOSER_PLACEHOLDER)}
          />
        </div>
      </div>
    </div>
  );
}

export function TeamChatThread({ client }: { client: TeamClient }) {
  const { t } = useTranslation("openhands");
  const [replyTo, setReplyTo] = useState<TeamMessage | null>(null);
  const messages = client.messages();
  const { roots, replyMap } = useMemo(() => {
    const ids = new Set(messages.map((m) => m.id));
    const kids = new Map<string, TeamMessage[]>();
    const top: TeamMessage[] = [];
    messages.forEach((m) => {
      if (m.parent && ids.has(m.parent)) {
        kids.set(m.parent, [...(kids.get(m.parent) ?? []), m]);
      } else {
        top.push(m);
      }
    });
    return { roots: top, replyMap: kids };
  }, [messages]);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div
        data-testid="team-thread"
        className="custom-scrollbar flex-1 overflow-y-auto px-4 py-2"
      >
        <div className="mx-auto w-full max-w-3xl">
          {roots.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              {t(I18nKey.TEAM_CHAT$NO_MESSAGES)}
            </p>
          ) : (
            <ul>
              {roots.map((m) => (
                <MessageRow
                  key={m.id}
                  message={m}
                  client={client}
                  depth={0}
                  replies={replyMap}
                  onReply={setReplyTo}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
      <TeamComposer
        client={client}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
      />
    </div>
  );
}
