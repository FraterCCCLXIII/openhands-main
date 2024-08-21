import { expect, test } from "vitest";
import { formatContributorCount } from "../../src/utils/format-contributor-count";

test("formatContributorCount", () => {
  expect(formatContributorCount(0)).toBe("No contributors");
  expect(formatContributorCount(42)).toBe("42");
  expect(formatContributorCount(61)).toBe("50+");
  expect(formatContributorCount(100)).toBe("100+");
  expect(formatContributorCount(162)).toBe("150+");
  expect(formatContributorCount(202)).toBe("200+");
  expect(formatContributorCount(1000)).toBe("1000+");
});
