import { schnorr } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes, utf8ToBytes } from "@noble/hashes/utils.js";

export interface EventTemplate {
  kind: number;
  tags: string[][];
  content: string;
  created_at?: number;
}

/** A signed Nostr event (NIP-01). */
export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export const eventId = (e: Pick<NostrEvent, "pubkey" | "created_at" | "kind" | "tags" | "content">): string =>
  bytesToHex(sha256(utf8ToBytes(JSON.stringify([0, e.pubkey, e.created_at, e.kind, e.tags, e.content]))));

export function signEvent(template: EventTemplate, secretHex: string): NostrEvent {
  const secret = hexToBytes(secretHex);
  const pubkey = bytesToHex(schnorr.getPublicKey(secret));
  const base = { pubkey, created_at: template.created_at ?? Math.floor(Date.now() / 1000), kind: template.kind, tags: template.tags, content: template.content };
  const id = eventId(base);
  return { ...base, id, sig: bytesToHex(schnorr.sign(hexToBytes(id), secret)) };
}

export function verifyEvent(e: NostrEvent): boolean {
  try {
    return e.id === eventId(e) && schnorr.verify(hexToBytes(e.sig), hexToBytes(e.id), hexToBytes(e.pubkey));
  } catch {
    return false;
  }
}

export const tagValue = (e: Pick<NostrEvent, "tags">, name: string): string | undefined => e.tags.find((t) => t[0] === name)?.[1];
export const tagValues = (e: Pick<NostrEvent, "tags">, name: string): string[] => e.tags.filter((t) => t[0] === name).map((t) => t[1]);
