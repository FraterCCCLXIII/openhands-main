import { expect, test } from "vitest";
import { formatDate } from "../../app/utils/format-date";

test("formatDate", () => {
  const isoDate = "2021-09-01T00:00:00.000Z";
  expect(formatDate(isoDate)).toBe("September 1, 2021");
});
