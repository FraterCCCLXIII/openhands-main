import { expect, test } from "vitest";
import { formatThousands } from "~/utils/format-thousands";

test("formatThousands", () => {
  expect(formatThousands(1000)).toBe("1k");
  expect(formatThousands(10000)).toBe("10k");
  expect(formatThousands(29541)).toBe("29k");
});
