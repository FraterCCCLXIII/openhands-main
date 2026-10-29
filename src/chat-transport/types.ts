/** Who wrote a message: a person, or an agent profile with its own identity. */
export type IdentityKind = "person" | "agent";

/**
 * A stable, attributable author. `id` is a public key on a network transport
 * and a local id (`you`, `maya`, `agent:Atlas`) on the local adapter.
 */
export interface Identity {
  id: string;
  displayName: string;
  kind: IdentityKind;
}

/** A channel is a shared repo (or repo + branch); locally, a conversation id. */
export type ChannelId = string;

/** An @mention that names an identity, never a free-text handle. */
export interface Mention {
  identityId: string;
}

export interface ChatMessage {
  id: string;
  channel: ChannelId;
  /** The message this answers, or null for a thread root. */
  parent: string | null;
  author: Identity;
  text: string;
  mentions: Mention[];
  /** ISO time. */
  timestamp: string;
}

export interface OutgoingMessage {
  parent?: string | null;
  text: string;
  mentions?: Mention[];
}

export type Member = Identity;
export type Unsubscribe = () => void;

/** The seam between the feed and a chat backend (local, Nostr/Buzz, Matrix). */
export interface ChatTransport {
  /** Replays existing messages, then delivers new ones until unsubscribed. */
  subscribe(
    channel: ChannelId,
    onMessage: (message: ChatMessage) => void,
  ): Unsubscribe;
  post(channel: ChannelId, message: OutgoingMessage): Promise<void>;
  members(channel: ChannelId): Promise<Member[]>;
  identity(): Identity;
}
