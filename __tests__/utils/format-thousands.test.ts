import { expect, test } from "vitest";
import { formatThousands } from "../../src/utils/format-thousands";

test("formatThousands", () => {
  // Intl.NumberFormat compact notation produces uppercase K with one decimal
  expect(formatThousands(1000)).toBe("1K");
  expect(formatThousands(10000)).toBe("10K");
  expect(formatThousands(29541)).toBe("29.5K");
});
