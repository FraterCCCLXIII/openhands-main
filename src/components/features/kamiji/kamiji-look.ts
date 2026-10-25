import type { KamijiPropName } from "./kamiji-catalog";
import type {
  KamijiAnimation,
  KamijiExpression,
  KamijiPose,
} from "./kamiji-expressions";

/**
 * The one table that says how a Kamiji looks for each kind of feed item,
 * notification and git event: face, clip or pose, tint, and an optional 3D
 * prop with an emoji that stands in for it when WebGL is unavailable.
 */
export interface KamijiLook {
  expression: KamijiExpression;
  /** Looping clip; ignored while `pose` is set, and replaced by "Idle" under reduced motion. */
  animation: KamijiAnimation;
  /** Static hand shape tweened into place; replaces the clip. */
  pose?: KamijiPose;
  /** Accent for the prop and the 2D fallback chip. */
  tint: string;
  prop?: KamijiPropName;
  /** 2D stand-in for `prop`. */
  emoji?: string;
}

export type KamijiStatusKey =
  | "idle"
  | "running"
  | "paused"
  | "waiting_for_confirmation"
  | "finished"
  | "error"
  | "stuck";

export type KamijiNotificationKey =
  | "needs_input"
  | "error"
  | "finished"
  | "working"
  | "paused"
  | "idle";

export type KamijiUpdateKey = "agent" | "action" | "error";

export type KamijiToastKey = "error" | "warning" | "success";

export type KamijiRefKey =
  | "pull_request"
  | "ticket"
  | "branch"
  | "worktree"
  | "subagents";

export type KamijiGitEventKey =
  | "pr_opened"
  | "pr_merged"
  | "merged"
  | "ci_running"
  | "ci_passed"
  | "ci_failed"
  | "conflict"
  | "review_requested"
  | "commit"
  | "issue_closed"
  | "release";

export type KamijiTabKey = "feed" | "notifications";

export type KamijiLookKey =
  | `status:${KamijiStatusKey}`
  | `notification:${KamijiNotificationKey}`
  | `update:${KamijiUpdateKey}`
  | `toast:${KamijiToastKey}`
  | `ref:${KamijiRefKey}`
  | `git:${KamijiGitEventKey}`
  | `tab:${KamijiTabKey}`;

const STATUS_LOOKS: Record<KamijiStatusKey, KamijiLook> = {
  idle: { expression: "neutral", animation: "Idle", tint: "#9aa4b2" },
  running: {
    expression: "neutral",
    animation: "Typing",
    tint: "#4cd964",
    prop: "gear",
    emoji: "⚙️",
  },
  paused: {
    expression: "sleepy",
    animation: "Idle",
    tint: "#8fb4ff",
    prop: "zzz",
    emoji: "💤",
  },
  waiting_for_confirmation: {
    expression: "thinking",
    animation: "Think",
    tint: "#8f7bff",
    prop: "question",
    emoji: "❓",
  },
  finished: {
    expression: "excited",
    animation: "Celebrate",
    tint: "#4cd964",
    prop: "check",
    emoji: "✅",
  },
  error: {
    expression: "surprised",
    animation: "Bounce",
    tint: "#ff4d4d",
    prop: "double_exclamation",
    emoji: "‼️",
  },
  stuck: {
    expression: "sad",
    animation: "Idle",
    tint: "#ff9f1c",
    prop: "sweat",
    emoji: "😓",
  },
};

// A notification shows the same face as the status it announces, so a card
// and its notification never disagree.
const NOTIFICATION_LOOKS: Record<KamijiNotificationKey, KamijiLook> = {
  needs_input: STATUS_LOOKS.waiting_for_confirmation,
  error: STATUS_LOOKS.error,
  finished: STATUS_LOOKS.finished,
  working: STATUS_LOOKS.running,
  paused: STATUS_LOOKS.paused,
  idle: STATUS_LOOKS.idle,
};

const UPDATE_LOOKS: Record<KamijiUpdateKey, KamijiLook> = {
  agent: { expression: "happy", animation: "Idle", tint: "#ffd23f" },
  action: {
    expression: "neutral",
    animation: "Typing",
    tint: "#9aa4b2",
    prop: "wrench",
    emoji: "🔧",
  },
  error: {
    expression: "surprised",
    animation: "Bounce",
    tint: "#ffc400",
    prop: "warning",
    emoji: "⚠️",
  },
};

const TOAST_LOOKS: Record<KamijiToastKey, KamijiLook> = {
  error: {
    expression: "sad",
    animation: "Idle",
    tint: "#ff4d4d",
    prop: "cross",
    emoji: "❌",
  },
  warning: {
    expression: "surprised",
    animation: "Idle",
    tint: "#ffc400",
    prop: "warning",
    emoji: "⚠️",
  },
  success: {
    expression: "happy",
    animation: "Celebrate",
    tint: "#4cd964",
    prop: "sparkle",
    emoji: "✨",
  },
};

const REF_LOOKS: Record<KamijiRefKey, KamijiLook> = {
  pull_request: {
    expression: "happy",
    animation: "Idle",
    tint: "#3fb261",
    prop: "git_pull_request",
    emoji: "🔀",
  },
  ticket: {
    expression: "neutral",
    animation: "Idle",
    tint: "#3fb261",
    prop: "git_issue_open",
    emoji: "🎫",
  },
  branch: {
    expression: "neutral",
    animation: "Idle",
    tint: "#7ee787",
    prop: "git_branch",
    emoji: "🌿",
  },
  worktree: {
    expression: "neutral",
    animation: "Idle",
    tint: "#7ee787",
    prop: "git_fork",
    emoji: "🍴",
  },
  subagents: {
    expression: "happy",
    animation: "Hello",
    tint: "#c77dff",
    prop: "plus",
    emoji: "👥",
  },
};

const GIT_LOOKS: Record<KamijiGitEventKey, KamijiLook> = {
  pr_opened: {
    expression: "happy",
    animation: "Wave",
    tint: "#3fb261",
    prop: "git_pull_request",
    emoji: "🔀",
  },
  pr_merged: {
    expression: "excited",
    animation: "Celebrate",
    tint: "#a371f7",
    prop: "git_pull_request_merged",
    emoji: "🎉",
  },
  merged: {
    expression: "excited",
    animation: "Celebrate",
    tint: "#ba8cff",
    prop: "git_merge",
    emoji: "🎉",
  },
  ci_running: {
    expression: "neutral",
    animation: "Typing",
    tint: "#ffc24a",
    prop: "git_ci_running",
    emoji: "⏳",
  },
  ci_passed: {
    expression: "happy",
    animation: "Idle",
    pose: "thumbsUp",
    tint: "#4cd964",
    prop: "git_check_pass",
    emoji: "✅",
  },
  ci_failed: {
    expression: "surprised",
    animation: "Bounce",
    tint: "#ff6b6b",
    prop: "git_ci_fail",
    emoji: "❌",
  },
  conflict: {
    expression: "angry",
    animation: "Idle",
    tint: "#ff8a5c",
    prop: "git_conflict",
    emoji: "💥",
  },
  review_requested: {
    expression: "thinking",
    animation: "Think",
    tint: "#5ac8fa",
    prop: "git_review",
    emoji: "👀",
  },
  commit: {
    expression: "happy",
    animation: "Idle",
    tint: "#7aa7ff",
    prop: "git_commit",
    emoji: "💾",
  },
  issue_closed: {
    expression: "happy",
    animation: "Celebrate",
    tint: "#a371f7",
    prop: "git_issue_closed",
    emoji: "☑️",
  },
  release: {
    expression: "excited",
    animation: "Celebrate",
    tint: "#ff6a4a",
    prop: "git_release",
    emoji: "🚀",
  },
};

const TAB_LOOKS: Record<KamijiTabKey, KamijiLook> = {
  feed: { expression: "happy", animation: "Idle", tint: "#ffd23f" },
  notifications: STATUS_LOOKS.idle,
};

const prefixed = <K extends string, P extends string>(
  prefix: P,
  looks: Record<K, KamijiLook>,
): Array<[`${P}:${K}`, KamijiLook]> =>
  (Object.keys(looks) as K[]).map((key) => [`${prefix}:${key}`, looks[key]]);

const LOOKS = new Map<string, KamijiLook>([
  ...prefixed("status", STATUS_LOOKS),
  ...prefixed("notification", NOTIFICATION_LOOKS),
  ...prefixed("update", UPDATE_LOOKS),
  ...prefixed("toast", TOAST_LOOKS),
  ...prefixed("ref", REF_LOOKS),
  ...prefixed("git", GIT_LOOKS),
  ...prefixed("tab", TAB_LOOKS),
]);

export const KAMIJI_LOOK_KEYS = [...LOOKS.keys()] as KamijiLookKey[];

export function getKamijiLook(key: KamijiLookKey): KamijiLook {
  return LOOKS.get(key) ?? STATUS_LOOKS.idle;
}

/** Key for a conversation execution status; anything unknown reads as idle. */
export function statusLookKey(status?: string | null): KamijiLookKey {
  const key = `status:${status}` as KamijiLookKey;
  return status && LOOKS.has(key) ? key : "status:idle";
}

export function notificationLookKey(
  kind: KamijiNotificationKey,
): KamijiLookKey {
  return `notification:${kind}`;
}

/** Null for the user's own messages, which keep the user avatar. */
export function updateLookKey(kind: string): KamijiLookKey | null {
  const key = `update:${kind}` as KamijiLookKey;
  return LOOKS.has(key) ? key : null;
}

/** Reduced motion keeps the face and prop but swaps any clip for a still idle. */
export function withReducedMotion(
  look: KamijiLook,
  reduced: boolean,
): KamijiLook {
  return reduced ? { ...look, animation: "Idle" } : look;
}
