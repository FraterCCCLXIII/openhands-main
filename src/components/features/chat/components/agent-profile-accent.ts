import {
  Atom,
  Bot,
  Brain,
  Bug,
  Cpu,
  Compass,
  FlaskConical,
  Hammer,
  Rocket,
  ShieldCheck,
  Sparkles,
  Telescope,
  Wand2,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

export const AGENT_ACCENT_ICONS: readonly LucideIcon[] = [
  Bot,
  Cpu,
  Sparkles,
  Wand2,
  Rocket,
  Brain,
  Zap,
  Atom,
  Hammer,
  FlaskConical,
  ShieldCheck,
  Telescope,
  Compass,
  Bug,
  Wrench,
];

const ACCENT_PALETTE = [
  "#7aa2f7",
  "#9ece6a",
  "#e0af68",
  "#bb9af7",
  "#f7768e",
  "#2ac3de",
  "#ff9e64",
];

/**
 * Stable accent for an agent profile, so each profile keeps the same colored
 * icon across renders and sessions without storing a color on the profile.
 */
export function agentProfileAccentColor(name: string): string {
  return ACCENT_PALETTE[hashName(name) % ACCENT_PALETTE.length];
}

function hashName(name: string): number {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return hash;
}

/** Index into {@link AGENT_ACCENT_ICONS}; stable per profile name. */
export function agentProfileIconIndex(name: string): number {
  return hashName(name) % AGENT_ACCENT_ICONS.length;
}
