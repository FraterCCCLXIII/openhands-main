import { useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { ContextMenuListItem } from "#/components/features/context-menu/context-menu-list-item";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { useCloseOnEscape } from "#/hooks/use-close-on-escape";
import { ContextMenu } from "#/ui/context-menu";
import { cn } from "#/utils/utils";

export interface FeedComposerMenuOption {
  id: string;
  label: string;
  detail?: string;
}

interface FeedComposerMenuProps {
  testId: string;
  /** Accessible name of the control, such as "Agent". */
  label: string;
  icon: ReactNode;
  /** What the trigger shows for the current choice. */
  value: string;
  options: FeedComposerMenuOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Why the control cannot be used; set to disable it and say so. */
  disabledReason?: string;
}

/** A small pill that opens a menu above it, for the Tower composer's pickers. */
export function FeedComposerMenu({
  testId,
  label,
  icon,
  value,
  options,
  selectedId,
  onSelect,
  disabledReason,
}: FeedComposerMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useClickOutsideElement<HTMLUListElement>(
    () => setOpen(false),
    triggerRef,
  );
  useCloseOnEscape(open, () => setOpen(false), triggerRef);

  return (
    <div ref={triggerRef} className="relative min-w-0 shrink-0">
      <button
        type="button"
        data-testid={testId}
        aria-label={`${label}: ${value}`}
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={Boolean(disabledReason)}
        title={disabledReason ?? value}
        onClick={() => setOpen((current) => !current)}
        className="flex max-w-44 items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-xs text-contrast hover:bg-base-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {icon}
        <span className="truncate">{value}</span>
        <ChevronDown size={14} aria-hidden className="shrink-0" />
      </button>
      {open ? (
        <ContextMenu
          ref={menuRef}
          testId={`${testId}-menu`}
          alignment="left"
          position="top"
          className="z-20 max-h-80 w-72 overflow-y-auto"
        >
          {options.map((option) => (
            <ContextMenuListItem
              key={option.id}
              testId={`${testId}-option`}
              onClick={() => {
                onSelect(option.id);
                setOpen(false);
              }}
              className={cn(option.id === selectedId && "bg-interactive-hover")}
            >
              <span className="flex min-w-0 flex-col text-left">
                <span className="truncate">{option.label}</span>
                {option.detail ? (
                  <span className="truncate text-xs text-muted">
                    {option.detail}
                  </span>
                ) : null}
              </span>
            </ContextMenuListItem>
          ))}
        </ContextMenu>
      ) : null}
    </div>
  );
}
