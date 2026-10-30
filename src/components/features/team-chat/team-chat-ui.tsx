import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { teamChatErrorKey } from "#/utils/team-chat-errors";
import { cn } from "#/utils/utils";

export const inputClassName =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-focus";
export const primaryButtonClassName =
  "inline-flex items-center justify-center gap-1 rounded-lg bg-contrast px-3 py-2 text-sm font-medium text-contrast-foreground transition-colors hover:bg-contrast/90 disabled:opacity-50";
export const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-contrast transition-colors hover:bg-surface-raised disabled:opacity-50";

export function ErrorNote({ error }: { error: unknown }) {
  const { t } = useTranslation("openhands");
  if (!error) return null;
  const { key, message } = teamChatErrorKey(error);
  return (
    <p role="alert" className="text-sm text-danger">
      {t(key, { message })}
    </p>
  );
}

export function Initials({
  name,
  agent = false,
}: {
  name: string;
  agent?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 shrink-0 items-center justify-center text-xs font-medium text-contrast",
        agent ? "rounded-md bg-surface-raised" : "rounded-full bg-surface",
      )}
    >
      {name.trim().slice(0, 2).toUpperCase()}
    </span>
  );
}

/** A read-only value with a Copy button, optionally hidden until revealed. */
export function CopyField({
  label,
  value,
  secret = false,
}: {
  label: string;
  value: string;
  secret?: boolean;
}) {
  const { t } = useTranslation("openhands");
  const [shown, setShown] = useState(!secret);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    void navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <input
          readOnly
          aria-label={label}
          type={shown ? "text" : "password"}
          value={value}
          className={cn(inputClassName, "font-mono text-xs")}
        />
        {secret && (
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={() => setShown((v) => !v)}
          >
            {t(shown ? I18nKey.TEAM_CHAT$HIDE : I18nKey.TEAM_CHAT$SHOW)}
          </button>
        )}
        <button
          type="button"
          className={secondaryButtonClassName}
          onClick={copy}
        >
          {t(copied ? I18nKey.TEAM_CHAT$COPIED : I18nKey.TEAM_CHAT$COPY)}
        </button>
      </div>
    </div>
  );
}
