import type { EventTemplate } from "./event";

/** Event kinds used for relay-based groups (NIP-29), profiles (NIP-01/24) and auth (NIP-42). */
export const KIND = {
  profile: 0,
  chat: 9,
  putUser: 9000,
  removeUser: 9001,
  editMetadata: 9002,
  createGroup: 9007,
  createInvite: 9009,
  joinRequest: 9021,
  leave: 9022,
  auth: 22242,
  groupMetadata: 39000,
  groupAdmins: 39001,
  groupMembers: 39002,
} as const;

export const createGroup = (group: string, name: string): EventTemplate => ({
  kind: KIND.createGroup,
  tags: [
    ["h", group],
    ["name", name],
  ],
  content: "",
});

export const putUser = (
  group: string,
  pubkey: string,
  roles: string[] = ["member"],
): EventTemplate => ({
  kind: KIND.putUser,
  tags: [
    ["h", group],
    ["p", pubkey, ...roles],
  ],
  content: "",
});

export const removeUser = (group: string, pubkey: string): EventTemplate => ({
  kind: KIND.removeUser,
  tags: [
    ["h", group],
    ["p", pubkey],
  ],
  content: "",
});

export const createInvite = (group: string, code: string): EventTemplate => ({
  kind: KIND.createInvite,
  tags: [
    ["h", group],
    ["code", code],
  ],
  content: "",
});

export const joinRequest = (group: string, code?: string): EventTemplate => ({
  kind: KIND.joinRequest,
  tags: [["h", group], ...(code ? [["code", code]] : [])],
  content: "",
});

/** A group message. A reply carries an NIP-10 `e` tag marked "reply"; mentions are `p` tags. */
export const chatMessage = (
  group: string,
  text: string,
  opts: { parent?: string | null; mentions?: string[] } = {},
): EventTemplate => ({
  kind: KIND.chat,
  tags: [
    ["h", group],
    ...(opts.parent ? [["e", opts.parent, "", "reply"]] : []),
    ...(opts.mentions ?? []).map((p) => ["p", p]),
  ],
  content: text,
});

/** A profile (kind 0). `bot` marks an agent (NIP-24); `owner` names the person who runs it. */
export const profile = (p: {
  name: string;
  bot?: boolean;
  owner?: string;
  about?: string;
}): EventTemplate => ({
  kind: KIND.profile,
  tags: [],
  content: JSON.stringify({
    name: p.name,
    ...(p.bot ? { bot: true } : {}),
    ...(p.owner ? { owner: p.owner } : {}),
    ...(p.about ? { about: p.about } : {}),
  }),
});

export const authEvent = (
  relayUrl: string,
  challenge: string,
): EventTemplate => ({
  kind: KIND.auth,
  tags: [
    ["relay", relayUrl],
    ["challenge", challenge],
  ],
  content: "",
});

/**
 * An invite is one string that carries everything a newcomer needs:
 * `buzzteam:<relay url>#<group id>:<code>`. The code is single use.
 */
export function encodeInvite(
  relayUrl: string,
  group: string,
  code: string,
): string {
  return `buzzteam:${relayUrl}#${group}:${code}`;
}
export function decodeInvite(text: string): {
  relayUrl: string;
  group: string;
  code: string;
} {
  const m = /^buzzteam:(.+)#([^:]+):([A-Za-z0-9_-]+)$/.exec(text.trim());
  if (!m) throw new Error("That is not a team invite.");
  return { relayUrl: m[1], group: m[2], code: m[3] };
}
