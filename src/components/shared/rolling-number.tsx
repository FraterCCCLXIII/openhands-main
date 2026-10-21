import { motion, useReducedMotion } from "framer-motion";
import { cn } from "#/utils/utils";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Odometer-style digit: a column of 0–9 that slides to the active digit. The
 * column is ten lines tall, so each digit is exactly 10% of its height.
 */
function RollingDigit({ digit }: { digit: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <span className="relative inline-block h-[1lh] overflow-hidden align-bottom">
      <motion.span
        className="flex flex-col"
        initial={false}
        animate={{ y: `${-digit * 10}%` }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 260, damping: 28 }
        }
      >
        {DIGITS.map((value) => (
          <span key={value} className="h-[1lh] text-center">
            {value}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export interface RollingNumberProps {
  value: number;
  /** Text before the number, such as "+" — always static. */
  prefix?: string;
  className?: string;
}

/**
 * Shows a count that rolls digit by digit whenever it changes, so live diff
 * totals read as a ticker rather than snapping to the new value. Digits are
 * keyed by their position from the right, so a digit that stays in place
 * keeps its column and only the changed places roll. The formatted value is
 * also exposed to assistive tech as plain text.
 */
export function RollingNumber({
  value,
  prefix = "",
  className,
}: RollingNumberProps) {
  const formatted = `${prefix}${value.toLocaleString()}`;
  const characters = Array.from(formatted);
  const positionsFromRight = characters.map(
    (_, index) => characters.length - index,
  );

  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      <span className="sr-only">{formatted}</span>
      <span aria-hidden className="inline-flex">
        {characters.map((character, index) => {
          const key = positionsFromRight[index];
          return /\d/.test(character) ? (
            <RollingDigit key={key} digit={Number(character)} />
          ) : (
            <span key={key} className="inline-block">
              {character}
            </span>
          );
        })}
      </span>
    </span>
  );
}
