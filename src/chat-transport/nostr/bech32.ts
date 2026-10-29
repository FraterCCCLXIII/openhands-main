// NIP-19 bech32 for npub and nsec: 32-byte keys only.
const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values: number[]): number {
  let chk = 1;
  values.forEach((value) => {
    const top = chk >>> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ value;
    GENERATORS.forEach((generator, i) => {
      if ((top >>> i) & 1) chk ^= generator;
    });
  });
  return chk >>> 0;
}

const hrpExpand = (hrp: string): number[] => [
  ...[...hrp].map((c) => c.charCodeAt(0) >>> 5),
  0,
  ...[...hrp].map((c) => c.charCodeAt(0) & 31),
];

function convertBits(data: number[], from: number, to: number, pad: boolean) {
  let acc = 0;
  let bits = 0;
  const out: number[] = [];
  const max = (1 << to) - 1;
  data.forEach((value) => {
    acc = (acc << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      out.push((acc >>> bits) & max);
    }
  });
  if (pad && bits > 0) out.push((acc << (to - bits)) & max);
  if (!pad && (bits >= from || ((acc << (to - bits)) & max) !== 0)) {
    throw new Error("Invalid key encoding.");
  }
  return out;
}

export function bech32Encode(hrp: string, bytes: Uint8Array): string {
  const data = convertBits([...bytes], 8, 5, true);
  const checksum = polymod([...hrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0]) ^ 1;
  const tail = Array.from({ length: 6 }, (_, i) => (checksum >>> (5 * (5 - i))) & 31);
  return `${hrp}1${[...data, ...tail].map((d) => CHARSET[d]).join("")}`;
}

export function bech32Decode(text: string): { hrp: string; bytes: Uint8Array } {
  const lower = text.trim().toLowerCase();
  const at = lower.lastIndexOf("1");
  if (at < 1 || lower.length < at + 7) throw new Error("Not a valid key.");
  const hrp = lower.slice(0, at);
  const data = [...lower.slice(at + 1)].map((c) => {
    const v = CHARSET.indexOf(c);
    if (v < 0) throw new Error("Not a valid key.");
    return v;
  });
  if (polymod([...hrpExpand(hrp), ...data]) !== 1) throw new Error("The key has a typo: its checksum does not match.");
  return { hrp, bytes: Uint8Array.from(convertBits(data.slice(0, -6), 5, 8, false)) };
}
