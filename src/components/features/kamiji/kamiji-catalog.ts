// Typed catalogue of the Kamikin mochi and props. Mirrors assets/mochi/index.json and
// assets/props/index.json; tests/kamiji-catalog.test.ts fails if they drift apart.

export interface KamijiMochiInfo {
  id: string;
  name: string;
  species: string;
  /** Standing height in model units (metres); used to frame the camera. */
  height: number;
}

export const KAMIJI_MOCHI = [
  { id: "kamikin-chochin", name: "chōchin", species: "slime", height: 0.55 },
  { id: "kamikin-hana", name: "hana", species: "fawn", height: 0.55 },
  { id: "kamikin-koke", name: "koke", species: "slime", height: 0.55 },
  { id: "kamikin-kon", name: "kon", species: "kitsune", height: 0.55 },
  { id: "kamikin-kumo", name: "kumo", species: "lamb", height: 0.55 },
  { id: "kamikin-pip", name: "Pip", species: "fox", height: 0.62 },
  { id: "kamikin-player", name: "Ren", species: "bunny", height: 1.25 },
  {
    id: "kamikin-player-bunny-3",
    name: "Kumo",
    species: "bunny",
    height: 0.55,
  },
  { id: "kamikin-player-cat-5", name: "Pipi", species: "cat", height: 0.55 },
  {
    id: "kamikin-player-chick-6",
    name: "Hoho",
    species: "chick",
    height: 0.55,
  },
  {
    id: "kamikin-player-hamster-4",
    name: "Riri",
    species: "hamster",
    height: 0.55,
  },
  {
    id: "kamikin-player-panda-2",
    name: "Kimi",
    species: "panda",
    height: 0.55,
  },
  { id: "kamikin-player-pup-8", name: "Mapu", species: "pup", height: 0.55 },
  { id: "kamikin-shizuku", name: "shizuku", species: "slime", height: 0.55 },
] as const satisfies readonly KamijiMochiInfo[];

export type KamijiMochiId = (typeof KAMIJI_MOCHI)[number]["id"];

export const KAMIJI_MOCHI_IDS: readonly KamijiMochiId[] = KAMIJI_MOCHI.map(
  (mochi) => mochi.id,
);

export const KAMIJI_PROPS = [
  { name: "heart", category: "emote", tint: "#ff5a7a" },
  { name: "star", category: "emote", tint: "#ffd23f" },
  { name: "sparkle", category: "emote", tint: "#ffe680" },
  { name: "zzz", category: "status", tint: "#8fb4ff" },
  { name: "lightbulb", category: "emote", tint: "#ffd23f" },
  { name: "anger", category: "emote", tint: "#ff4d4d" },
  { name: "sweat", category: "status", tint: "#7fd4ff" },
  { name: "tear", category: "status", tint: "#5ab8ff" },
  { name: "question", category: "symbol", tint: "#8f7bff" },
  { name: "exclamation", category: "symbol", tint: "#ff9f1c" },
  { name: "double_exclamation", category: "symbol", tint: "#ff9f1c" },
  { name: "music_note", category: "symbol", tint: "#b07bff" },
  { name: "fire", category: "status", tint: "#ff7a1a" },
  { name: "check", category: "symbol", tint: "#4cd964" },
  { name: "cross", category: "symbol", tint: "#ff4d4d" },
  { name: "plus", category: "symbol", tint: "#4cd964" },
  { name: "warning", category: "status", tint: "#ffc400" },
  { name: "clock", category: "status", tint: "#7a8cff" },
  { name: "gear", category: "tool", tint: "#9aa4b2" },
  { name: "magnifier", category: "tool", tint: "#5ac8fa" },
  { name: "wrench", category: "tool", tint: "#9aa4b2" },
  { name: "branch", category: "dev", tint: "#7ee787" },
  { name: "pull_request", category: "dev", tint: "#a371f7" },
  { name: "merge", category: "dev", tint: "#ba8cff" },
  { name: "git_commit", category: "git", tint: "#7aa7ff" },
  { name: "git_branch", category: "git", tint: "#7ee787" },
  { name: "git_fork", category: "git", tint: "#7ee787" },
  { name: "git_pull_request", category: "git", tint: "#3fb261" },
  { name: "git_pull_request_merged", category: "git", tint: "#a371f7" },
  { name: "git_merge", category: "git", tint: "#ba8cff" },
  { name: "git_issue_open", category: "git", tint: "#3fb261" },
  { name: "git_issue_closed", category: "git", tint: "#a371f7" },
  { name: "git_check_pass", category: "git", tint: "#4cd964" },
  { name: "git_ci_fail", category: "git", tint: "#ff6b6b" },
  { name: "git_ci_running", category: "git", tint: "#ffc24a" },
  { name: "git_conflict", category: "git", tint: "#ff8a5c" },
  { name: "git_review", category: "git", tint: "#5ac8fa" },
  { name: "git_release", category: "git", tint: "#ff6a4a" },
] as const;

export type KamijiPropName = (typeof KAMIJI_PROPS)[number]["name"];

export const KAMIJI_PROP_NAMES: readonly KamijiPropName[] = KAMIJI_PROPS.map(
  (prop) => prop.name,
);

/** Suggested colour per prop (from assets/props/index.json). */
export const KAMIJI_PROP_TINTS: Readonly<Record<KamijiPropName, string>> =
  Object.fromEntries(
    KAMIJI_PROPS.map((prop) => [prop.name, prop.tint]),
  ) as Record<KamijiPropName, string>;
