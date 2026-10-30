import { KamijiMochi } from "./kamiji-mochi";
import { KAMIJI_MOCHI, type KamijiMochiId } from "./kamiji-catalog";
import type { KamijiExpression } from "./kamiji-expressions";

// Whole-body-height props such as "Ren" (a tall player model) crop badly at avatar size.
const AVATAR_MOCHI = KAMIJI_MOCHI.filter((mochi) => mochi.height <= 0.62);
const HASH_MULTIPLIER = 31;

/** A stable Mochi per name, so the same agent always gets the same Kamikin. */
export function getKamijiMochiForName(seed: string): KamijiMochiId {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * HASH_MULTIPLIER + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_MOCHI[hash % AVATAR_MOCHI.length].id;
}

/** An agent's avatar: its own Kamikin Mochi, head-cropped to fit a list row. */
export function KamijiAgentAvatar({
  name,
  size = 44,
  expression = "happy",
  className,
}: {
  name: string;
  size?: number;
  expression?: KamijiExpression;
  className?: string;
}) {
  return (
    <KamijiMochi
      character={getKamijiMochiForName(name)}
      expression={expression}
      frame="head"
      size={size}
      className={className}
    />
  );
}
