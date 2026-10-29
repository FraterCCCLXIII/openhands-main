import React from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";

const COLLAPSE_AT = 280;

/** Pre-wrapped text that folds behind a "Show more" toggle when long. */
export function CollapsibleText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);
  const long = text.length > COLLAPSE_AT;
  return (
    <div className="flex flex-col gap-1">
      <p
        className={cn(
          "whitespace-pre-wrap break-words leading-relaxed",
          long && !open && "line-clamp-4",
          className,
        )}
      >
        {text}
      </p>
      {long ? (
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-fit cursor-pointer items-center gap-0.5 text-xs text-muted transition-colors hover:text-foreground"
        >
          {t(
            open
              ? I18nKey.FEED$DETAILS_SHOW_LESS
              : I18nKey.FEED$DETAILS_SHOW_MORE,
          )}
          <ChevronDown
            className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
          />
        </button>
      ) : null}
    </div>
  );
}
