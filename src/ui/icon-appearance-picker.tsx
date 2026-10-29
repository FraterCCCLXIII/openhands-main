import React from "react";
import { AppearancePortal } from "#/components/shared/appearance-portal";
import * as LucideIcons from "lucide-react";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { cn } from "#/utils/utils";
import {
  ICON_BACKGROUND_PRESETS,
  type IconBackgroundPresetKey,
  StyledIcon,
  resolveBackgroundColor,
} from "./styled-icon";

/** Common emojis for quick selection. */
const COMMON_EMOJIS = [
  "📁",
  "📂",
  "📊",
  "📈",
  "📉",
  "📋",
  "📝",
  "📄",
  "📃",
  "🗂️",
  "🗃️",
  "💼",
  "🎯",
  "🚀",
  "⚡",
  "🔥",
  "✨",
  "💡",
  "🔧",
  "⚙️",
  "🛠️",
  "🔨",
  "📌",
  "🏷️",
  "🎨",
  "🖼️",
  "📐",
  "📏",
  "🧩",
  "🔗",
  "🌐",
  "💾",
  "📦",
  "🗄️",
  "🧮",
  "🎲",
];

/** Common Lucide icons for quick selection. */
const COMMON_LUCIDE_ICONS = [
  "Folder",
  "FolderOpen",
  "File",
  "FileText",
  "Database",
  "Server",
  "Cloud",
  "Globe",
  "Code",
  "Terminal",
  "Cpu",
  "HardDrive",
  "Layers",
  "Package",
  "Box",
  "Archive",
  "Grid3x3",
  "LayoutGrid",
  "LayoutDashboard",
  "PieChart",
  "BarChart3",
  "LineChart",
  "TrendingUp",
  "Target",
  "Crosshair",
  "Compass",
  "Map",
  "Flag",
  "Bookmark",
  "Star",
  "Heart",
  "Zap",
  "Rocket",
  "Sparkles",
  "Lightbulb",
];

export interface IconAppearanceValue {
  background?: string | null;
  emoji?: string | null;
  lucide_icon?: string | null;
}

interface IconAppearancePickerProps {
  value: IconAppearanceValue;
  onChange: (value: IconAppearanceValue) => void;
  /** Size of the preview icon. */
  previewSize?: number;
  className?: string;
}

type TabType = "emoji" | "icon";

const POPOVER_WIDTH_PX = 320;

interface IconAppearancePanelProps {
  value: IconAppearanceValue;
  onChange: (value: IconAppearanceValue) => void;
  /** Called after the icon is cleared, so a popover can close itself. */
  onClear?: () => void;
}

/**
 * The picker's controls without a trigger or popover: background colors, an
 * emoji / icon grid, a preview and a clear action. Render it in any surface,
 * such as a modal.
 */
export function IconAppearancePanel({
  value,
  onChange,
  onClear,
}: IconAppearancePanelProps) {
  const [activeTab, setActiveTab] = React.useState<TabType>("emoji");
  const selectedBackground = value.background || "slate";

  const handleColorSelect = (color: string) => {
    onChange({ ...value, background: color });
  };

  const handleEmojiSelect = (emoji: string) => {
    onChange({ ...value, emoji, lucide_icon: null });
  };

  const handleLucideSelect = (iconName: string) => {
    onChange({ ...value, emoji: null, lucide_icon: iconName });
  };

  const handleClear = () => {
    onChange({ background: null, emoji: null, lucide_icon: null });
    onClear?.();
  };

  return (
    <>
      {/* Preview and clear */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Preview:</span>
          <StyledIcon
            size={28}
            background={selectedBackground}
            emoji={value.emoji}
            lucideIcon={value.lucide_icon}
          >
            <LucideIcons.Image
              width={16}
              height={16}
              className="text-white/60"
            />
          </StyledIcon>
        </div>
        <button
          type="button"
          onClick={handleClear}
          className="text-xs text-muted hover:text-danger"
        >
          Clear
        </button>
      </div>

      {/* Color palette */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted">Background Color</span>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(ICON_BACKGROUND_PRESETS).map(([key, color]) => {
            const isSelected = selectedBackground === key;
            return (
              <button
                key={key}
                type="button"
                aria-label={key}
                title={key}
                data-testid={`color-swatch-${key}`}
                onClick={() => handleColorSelect(key)}
                className={cn(
                  "size-6 cursor-pointer rounded-md border-2 transition-transform hover:scale-110",
                  isSelected
                    ? "border-contrast ring-1 ring-contrast"
                    : "border-transparent",
                )}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 rounded-lg bg-surface-base p-1">
        <button
          type="button"
          onClick={() => setActiveTab("emoji")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "emoji"
              ? "bg-surface-raised text-contrast"
              : "text-muted hover:text-contrast",
          )}
        >
          Emoji
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("icon")}
          className={cn(
            "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            activeTab === "icon"
              ? "bg-surface-raised text-contrast"
              : "text-muted hover:text-contrast",
          )}
        >
          Icon
        </button>
      </div>

      {/* Icon/Emoji grid */}
      <div className="custom-scrollbar flex max-h-48 flex-wrap gap-1 overflow-y-auto">
        {activeTab === "emoji"
          ? COMMON_EMOJIS.map((emoji) => {
              const isSelected = value.emoji === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiSelect(emoji)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md text-lg transition-colors hover:bg-surface-raised",
                    isSelected && "bg-accent/20 ring-1 ring-accent",
                  )}
                >
                  {emoji}
                </button>
              );
            })
          : COMMON_LUCIDE_ICONS.map((iconName) => {
              const Icon = LucideIcons[
                iconName as keyof typeof LucideIcons
              ] as React.FC<{ className?: string }>;
              if (!Icon) return null;
              const isSelected = value.lucide_icon === iconName;
              return (
                <button
                  key={iconName}
                  type="button"
                  title={iconName}
                  onClick={() => handleLucideSelect(iconName)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md transition-colors hover:bg-surface-raised",
                    isSelected && "bg-accent/20 ring-1 ring-accent",
                  )}
                >
                  <Icon className="size-4 text-contrast" />
                </button>
              );
            })}
      </div>
    </>
  );
}

/**
 * A picker component for selecting icon appearance (background color + icon/emoji).
 */
export function IconAppearancePicker({
  value,
  onChange,
  previewSize = 32,
  className,
}: IconAppearancePickerProps) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const anchorRect = open ? anchorRef.current?.getBoundingClientRect() : null;
  const menuStyle: React.CSSProperties | undefined = anchorRect
    ? {
        left: Math.min(
          Math.max(8, anchorRect.left),
          window.innerWidth - POPOVER_WIDTH_PX - 8,
        ),
        top: anchorRect.bottom + 4,
      }
    : undefined;
  const menuRef = useClickOutsideElement<HTMLDivElement>(
    () => setOpen(false),
    anchorRef,
  );

  const selectedBackground = value.background || "slate";
  const hasIcon = Boolean(value.emoji || value.lucide_icon);

  return (
    <div className={cn("relative", className)}>
      <button
        ref={anchorRef}
        type="button"
        data-testid="icon-appearance-picker-trigger"
        aria-label="Choose icon appearance"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-md border border-border p-2 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <StyledIcon
          size={previewSize}
          background={selectedBackground}
          emoji={value.emoji}
          lucideIcon={value.lucide_icon}
        >
          <LucideIcons.Image
            width={previewSize * 0.6}
            height={previewSize * 0.6}
            className="text-white/60"
          />
        </StyledIcon>
        <span className="text-sm text-tertiary-light">
          {hasIcon ? "Change icon" : "Choose icon"}
        </span>
      </button>

      {open ? (
        <AppearancePortal>
          <div
            ref={menuRef}
            data-testid="icon-appearance-picker-menu"
            style={menuStyle}
            className="fixed z-50 flex w-80 flex-col gap-3 rounded-xl border border-border-subtle bg-tertiary p-3 shadow-lg"
          >
            <IconAppearancePanel
              value={value}
              onChange={onChange}
              onClear={() => setOpen(false)}
            />
          </div>
        </AppearancePortal>
      ) : null}
    </div>
  );
}
