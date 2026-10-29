import { schnorr } from "@noble/curves/secp256k1.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";
import { bech32Decode, bech32Encode } from "./bech32";

/** A Nostr identity: one secp256k1 key. The secret never leaves the browser that made it. */
export interface Account {
  /** Hex secret key. */
  secretKey: string;
  /** Hex public key: the identity everyone else sees. */
  pubkey: string;
  npub: string;
  nsec: string;
  name: string;
  /** An agent identity is a person's key too; this names who runs it. */
  kind: "person" | "agent";
  ownerPubkey?: string;
}

export const npubOf = (pubkey: string): string =>
  bech32Encode("npub", hexToBytes(pubkey));
export const shortNpub = (pubkey: string): string => {
  const n = npubOf(pubkey);
  return `${n.slice(0, 9)}…${n.slice(-4)}`;
};

export function accountFromSecret(
  secretHex: string,
  extra: Partial<Pick<Account, "name" | "kind" | "ownerPubkey">> = {},
): Account {
  const secret = hexToBytes(secretHex);
  const pubkey = bytesToHex(schnorr.getPublicKey(secret));
  return {
    secretKey: secretHex,
    pubkey,
    npub: npubOf(pubkey),
    nsec: bech32Encode("nsec", secret),
    name: extra.name ?? "",
    kind: extra.kind ?? "person",
    ...(extra.ownerPubkey ? { ownerPubkey: extra.ownerPubkey } : {}),
  };
}

export function generateAccount(
  name: string,
  extra: Partial<Pick<Account, "kind" | "ownerPubkey">> = {},
): Account {
  return accountFromSecret(bytesToHex(schnorr.utils.randomSecretKey()), {
    name,
    ...extra,
  });
}

/** Reads an `nsec1…` key or a 64-character hex secret. */
export function secretFromInput(input: string): string {
  const text = input.trim();
  if (/^[0-9a-f]{64}$/i.test(text)) return text.toLowerCase();
  const { hrp, bytes } = bech32Decode(text);
  if (hrp !== "nsec" || bytes.length !== 32)
    throw new Error("That is not a secret key (it should start with nsec1).");
  return bytesToHex(bytes);
}

/** Reads an `npub1…` key or a 64-character hex public key. */
export function pubkeyFromInput(input: string): string {
  const text = input.trim();
  if (/^[0-9a-f]{64}$/i.test(text)) return text.toLowerCase();
  const { hrp, bytes } = bech32Decode(text);
  if (hrp !== "npub" || bytes.length !== 32)
    throw new Error("That is not a public key (it should start with npub1).");
  return bytesToHex(bytes);
}
