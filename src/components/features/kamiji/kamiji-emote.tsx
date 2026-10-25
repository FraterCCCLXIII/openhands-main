import React from "react";
import { cn } from "#/utils/utils";
import { KamijiAvatar, KamijiAvatarProps } from "./kamiji-avatar";

export type KamijiEmoteType =
  | "panicLines"
  | "speechBubble"
  | "thoughtBubble"
  | "sweatDrop"
  | "exclamation"
  | "doubleExclamation"
  | "question"
  | "heart"
  | "sparkle"
  | "zzz"
  | "lightbulb"
  | "angerVein"
  | "musicNote"
  | "dizzySwirl"
  | "tear"
  | "blush";

export const KAMIJI_EMOTE_TYPES: readonly KamijiEmoteType[] = [
  "panicLines",
  "speechBubble",
  "thoughtBubble",
  "sweatDrop",
  "exclamation",
  "doubleExclamation",
  "question",
  "heart",
  "sparkle",
  "zzz",
  "lightbulb",
  "angerVein",
  "musicNote",
  "dizzySwirl",
  "tear",
  "blush",
];

const DEFAULT_EMOTE_SIZE = 32;
const EMOTE_SCALE = 0.3;
const BUBBLE_TEXT_MAX = 6;

const STROKE = "stroke-current fill-none";
const ROUND_PROPS = {
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

interface EmoteArtProps {
  text?: string;
}

/** Each entry draws into a 64x64 box and returns its theme colour class. */
const EMOTE_ART: Record<
  KamijiEmoteType,
  {
    color: string;
    loop: string;
    draw: (props: EmoteArtProps) => React.ReactNode;
  }
> = {
  panicLines: {
    color: "text-foreground",
    loop: "kamiji-emote-shake",
    draw: () => (
      <g className={STROKE} {...ROUND_PROPS} strokeWidth="5">
        <path d="M32 6 V22" />
        <path d="M12 14 L21 26" />
        <path d="M52 14 L43 26" />
        <path d="M5 34 L19 36" />
        <path d="M59 34 L45 36" />
      </g>
    ),
  },
  speechBubble: {
    color: "text-foreground",
    loop: "kamiji-emote-bob",
    draw: ({ text }) => (
      <>
        <path
          d="M14 8 H50 A8 8 0 0 1 58 16 V34 A8 8 0 0 1 50 42 H34 L20 56 V42 H14 A8 8 0 0 1 6 34 V16 A8 8 0 0 1 14 8 Z"
          className="fill-current"
        />
        {text ? (
          <text
            x="32"
            y="31"
            textAnchor="middle"
            fontSize="17"
            fontWeight="700"
            className="fill-canvas-base"
          >
            {text.slice(0, BUBBLE_TEXT_MAX)}
          </text>
        ) : (
          <g className="fill-canvas-base">
            <circle cx="20" cy="25" r="4" />
            <circle cx="32" cy="25" r="4" />
            <circle cx="44" cy="25" r="4" />
          </g>
        )}
      </>
    ),
  },
  thoughtBubble: {
    color: "text-foreground",
    loop: "kamiji-emote-bob",
    draw: () => (
      <>
        <g className="fill-current">
          <ellipse cx="34" cy="22" rx="26" ry="16" />
          <circle cx="14" cy="46" r="6" />
          <circle cx="6" cy="58" r="3.5" />
        </g>
        <g className="fill-canvas-base">
          <circle cx="22" cy="22" r="3.5" />
          <circle cx="34" cy="22" r="3.5" />
          <circle cx="46" cy="22" r="3.5" />
        </g>
      </>
    ),
  },
  sweatDrop: {
    color: "text-foreground",
    loop: "kamiji-emote-drip",
    draw: () => (
      <>
        <path
          d="M32 6 C32 6 14 28 14 40 A18 18 0 0 0 50 40 C50 28 32 6 32 6 Z"
          className="fill-current"
        />
        <path
          d="M23 40 A9 9 0 0 0 30 49"
          className="stroke-canvas-base fill-none opacity-70"
          {...ROUND_PROPS}
          strokeWidth="4"
        />
      </>
    ),
  },
  exclamation: {
    color: "text-feedback-warning",
    loop: "kamiji-emote-pulse",
    draw: () => (
      <g className="fill-current">
        <rect x="26" y="4" width="12" height="38" rx="6" />
        <circle cx="32" cy="54" r="7" />
      </g>
    ),
  },
  doubleExclamation: {
    color: "text-feedback-warning",
    loop: "kamiji-emote-pulse",
    draw: () => (
      <g className="fill-current">
        <rect x="12" y="6" width="11" height="34" rx="5.5" />
        <circle cx="17.5" cy="52" r="6" />
        <rect x="41" y="6" width="11" height="34" rx="5.5" />
        <circle cx="46.5" cy="52" r="6" />
      </g>
    ),
  },
  question: {
    color: "text-info",
    loop: "kamiji-emote-bob",
    draw: () => (
      <>
        <path
          d="M19 21 C19 8 45 8 45 21 C45 32 32 32 32 43"
          className={STROKE}
          {...ROUND_PROPS}
          strokeWidth="9"
        />
        <circle cx="32" cy="55" r="5.5" className="fill-current" />
      </>
    ),
  },
  heart: {
    color: "text-status-error",
    loop: "kamiji-emote-pulse",
    draw: () => (
      <path
        d="M32 56 C8 38 4 24 4 18 A14 14 0 0 1 32 14 A14 14 0 0 1 60 18 C60 24 56 38 32 56 Z"
        className="fill-current"
      />
    ),
  },
  sparkle: {
    color: "text-feedback-warning",
    loop: "kamiji-emote-twinkle",
    draw: () => (
      <g className="fill-current">
        <path d="M26 4 C28 22 34 28 50 30 C34 32 28 38 26 56 C24 38 18 32 2 30 C18 28 24 22 26 4 Z" />
        <path d="M50 4 C51 10 53 12 59 13 C53 14 51 16 50 22 C49 16 47 14 41 13 C47 12 49 10 50 4 Z" />
        <path d="M52 40 C53 46 55 48 61 49 C55 50 53 52 52 58 C51 52 49 50 43 49 C49 48 51 46 52 40 Z" />
      </g>
    ),
  },
  zzz: {
    color: "text-foreground",
    loop: "kamiji-emote-drift",
    draw: () => (
      <g className={STROKE} {...ROUND_PROPS} strokeWidth="5">
        <path d="M6 44 H22 L6 58 H22" />
        <path d="M26 24 H38 L26 36 H38" className="kamiji-emote-delay-1" />
        <path d="M44 6 H54 L44 16 H54" className="kamiji-emote-delay-2" />
      </g>
    ),
  },
  lightbulb: {
    color: "text-feedback-warning",
    loop: "kamiji-emote-pulse",
    draw: () => (
      <>
        <path
          d="M32 10 A16 16 0 0 0 22 38 V44 H42 V38 A16 16 0 0 0 32 10 Z"
          className="fill-current"
        />
        <rect
          x="23"
          y="47"
          width="18"
          height="5"
          rx="2.5"
          className="fill-current"
        />
        <rect
          x="27"
          y="54"
          width="10"
          height="5"
          rx="2.5"
          className="fill-current"
        />
        <g className={STROKE} {...ROUND_PROPS} strokeWidth="4">
          <path d="M32 1 V4" />
          <path d="M8 12 L11 15" />
          <path d="M56 12 L53 15" />
          <path d="M3 30 H7" />
          <path d="M61 30 H57" />
        </g>
      </>
    ),
  },
  angerVein: {
    color: "text-status-error",
    loop: "kamiji-emote-pulse",
    draw: () => (
      <g className={STROKE} {...ROUND_PROPS} strokeWidth="6">
        <path d="M8 26 C20 26 26 20 26 8" />
        <path d="M56 26 C44 26 38 20 38 8" />
        <path d="M8 38 C20 38 26 44 26 56" />
        <path d="M56 38 C44 38 38 44 38 56" />
      </g>
    ),
  },
  musicNote: {
    color: "text-info",
    loop: "kamiji-emote-bob",
    draw: () => (
      <g className="fill-current">
        <ellipse
          cx="18"
          cy="48"
          rx="10"
          ry="7.5"
          transform="rotate(-20 18 48)"
        />
        <rect x="25" y="8" width="5" height="40" rx="2" />
        <path d="M28 8 C38 10 46 16 44 30 C42 22 36 20 28 20 Z" />
      </g>
    ),
  },
  dizzySwirl: {
    color: "text-foreground",
    loop: "kamiji-emote-spin",
    draw: () => (
      <path
        d="M32 32 m0 0 a4 4 0 0 1 8 0 a8 8 0 0 1 -16 0 a12 12 0 0 1 24 0 a16 16 0 0 1 -32 0 a20 20 0 0 1 40 0"
        className={STROKE}
        {...ROUND_PROPS}
        strokeWidth="4.5"
      />
    ),
  },
  tear: {
    color: "text-foreground",
    loop: "kamiji-emote-drip",
    draw: () => (
      <path
        d="M32 12 C32 12 20 28 20 38 A12 12 0 0 0 44 38 C44 28 32 12 32 12 Z"
        className="fill-current"
      />
    ),
  },
  blush: {
    color: "text-status-error",
    loop: "kamiji-emote-pulse",
    draw: () => (
      <g className={cn(STROKE, "opacity-80")} {...ROUND_PROPS} strokeWidth="4">
        <path d="M6 36 L12 22" />
        <path d="M15 36 L21 22" />
        <path d="M24 36 L30 22" />
        <path d="M36 36 L42 22" />
        <path d="M45 36 L51 22" />
        <path d="M54 36 L60 22" />
      </g>
    ),
  },
};

export interface KamijiEmoteProps {
  type: KamijiEmoteType;
  /** Edge length in CSS pixels. */
  size?: number;
  /** Short text for the speech bubble (first characters only). */
  text?: string;
  className?: string;
}

/** Decorative comic-style effect; the avatar it decorates carries the label. */
export function KamijiEmote({
  type,
  size = DEFAULT_EMOTE_SIZE,
  text,
  className,
}: KamijiEmoteProps) {
  const art = EMOTE_ART[type];
  return (
    <svg
      key={type}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      data-testid="kamiji-emote"
      data-emote={type}
      className={cn("kamiji-emote", art.color, className)}
    >
      <g className={cn("kamiji-emote-loop", art.loop)}>{art.draw({ text })}</g>
    </svg>
  );
}

export type KamijiEmotePlacement = "top-right" | "top-left" | "face";

const DEFAULT_PLACEMENT: Partial<
  Record<KamijiEmoteType, KamijiEmotePlacement>
> = {
  sweatDrop: "top-left",
  panicLines: "top-left",
  zzz: "top-left",
  speechBubble: "top-right",
  blush: "face",
  tear: "face",
};

const PLACEMENT_CLASS: Record<KamijiEmotePlacement, string> = {
  "top-right": "right-0 top-0 translate-x-[5%] translate-y-[5%]",
  "top-left": "left-0 top-0 -translate-x-[5%] translate-y-[5%]",
  face: "inset-x-0 top-1/2 flex -translate-y-1/4 justify-center",
};

export interface KamijiWithEmoteProps extends KamijiAvatarProps {
  emote?: KamijiEmoteType | null;
  emoteText?: string;
  emotePlacement?: KamijiEmotePlacement;
}

/** An avatar with an emote anchored around it; the avatar itself is untouched. */
export function KamijiWithEmote({
  emote,
  emoteText,
  emotePlacement,
  className,
  ...avatarProps
}: KamijiWithEmoteProps) {
  const size = avatarProps.size ?? DEFAULT_EMOTE_SIZE;
  const placement =
    emotePlacement ?? (emote && DEFAULT_PLACEMENT[emote]) ?? "top-right";
  return (
    <span className={cn("relative inline-block shrink-0", className)}>
      <KamijiAvatar {...avatarProps} />
      {emote && (
        <span
          className={cn(
            "pointer-events-none absolute",
            PLACEMENT_CLASS[placement],
          )}
        >
          <KamijiEmote
            type={emote}
            text={emoteText}
            size={Math.round(size * EMOTE_SCALE)}
          />
        </span>
      )}
    </span>
  );
}
