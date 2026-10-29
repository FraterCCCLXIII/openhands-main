import React from "react";
import { ChevronDown, FilePlus2, FileDiff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import type { FileChange } from "#/utils/code-activity";
import { cn } from "#/utils/utils";
import { CopyButton } from "./code-block";

const MARK = { add: "+", del: "−", ctx: " " } as const;

const ROW = {
  add: "bg-success/10 text-success",
  del: "bg-danger/10 text-danger",
  ctx: "text-muted",
} as const;

const COLLAPSED_LINES = 14;

/** One file's change as a colored diff: green for added lines, red for removed. */
export function DiffBlock({ change }: { change: FileChange }) {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);
  const long = change.lines.length > COLLAPSED_LINES;
  const shown =
    open || !long ? change.lines : change.lines.slice(0, COLLAPSED_LINES);
  const Icon = change.kind === "create" ? FilePlus2 : FileDiff;
  const text = change.lines
    .map(
      (l) =>
        `${l.type === "add" ? "+" : l.type === "del" ? "-" : " "}${l.text}`,
    )
    .join("\n");
  return (
    <div
      data-testid="turn-details-diff"
      className="overflow-hidden rounded-lg border border-border bg-canvas-base"
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface-raised px-2 py-1">
        <Icon className="h-3.5 w-3.5 flex-shrink-0 text-muted" aria-hidden />
        <span
          className="min-w-0 flex-1 truncate font-mono text-xs text-foreground"
          title={change.path}
        >
          {change.path}
        </span>
        <span className="font-mono text-xs text-success">{`+${change.added}`}</span>
        <span className="font-mono text-xs text-danger">{`−${change.removed}`}</span>
        <CopyButton text={text} />
      </div>
      <div className="custom-scrollbar max-h-80 overflow-auto py-1">
        {shown.map((line, index) => (
          <div
            // Diff lines have no stable id; their position is the identity.
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            data-diff={line.type}
            className={cn(
              "flex whitespace-pre font-mono text-xs leading-5",
              ROW[line.type],
            )}
          >
            <span
              aria-hidden
              className="w-5 flex-shrink-0 select-none text-center opacity-70"
            >
              {MARK[line.type]}
            </span>
            <span className="pr-3">{line.text || " "}</span>
          </div>
        ))}
      </div>
      {long || change.truncated ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full cursor-pointer items-center gap-1 border-t border-border px-2 py-1 text-xs text-muted hover:text-foreground"
        >
          <ChevronDown
            className={cn("h-3 w-3", open && "rotate-180")}
            aria-hidden
          />
          {open
            ? t(I18nKey.FEED$DETAILS_SHOW_LESS)
            : t(I18nKey.FEED$DETAILS_SHOW_MORE)}
        </button>
      ) : null}
    </div>
  );
}
