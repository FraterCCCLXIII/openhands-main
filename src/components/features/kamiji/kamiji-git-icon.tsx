import type { IconType } from "react-icons";
import {
  GoCheckCircleFill,
  GoGitCommit,
  GoGitMerge,
  GoGitPullRequest,
  GoXCircleFill,
} from "react-icons/go";
import { cn } from "#/utils/utils";

export type KamijiGitIconType =
  | "commit"
  | "merge"
  | "pullRequest"
  | "error"
  | "pass";

export const KAMIJI_GIT_ICON_TYPES: readonly KamijiGitIconType[] = [
  "commit",
  "pullRequest",
  "merge",
  "pass",
  "error",
];

const ICONS: Record<KamijiGitIconType, IconType> = {
  commit: GoGitCommit,
  merge: GoGitMerge,
  pullRequest: GoGitPullRequest,
  error: GoXCircleFill,
  pass: GoCheckCircleFill,
};

const TONES: Record<KamijiGitIconType, string> = {
  commit: "text-foreground",
  merge: "text-primary",
  pullRequest: "text-foreground",
  error: "text-status-error",
  pass: "text-status-success",
};

interface KamijiGitIconProps {
  type: KamijiGitIconType;
  /** Edge length in CSS pixels. */
  size?: number;
  className?: string;
}

/** GitHub-style (Octicons) status glyphs that sit beside an agent hand. */
export function KamijiGitIcon({
  type,
  size = 28,
  className,
}: KamijiGitIconProps) {
  const Icon = ICONS[type];
  return (
    <Icon
      size={size}
      aria-hidden="true"
      data-testid={`kamiji-git-icon-${type}`}
      className={cn(TONES[type], className)}
    />
  );
}
