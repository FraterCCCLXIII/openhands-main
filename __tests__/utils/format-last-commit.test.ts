import { expect, test } from "vitest";
import { formatLastCommit } from "../../src/utils/format-last-commit";

test("formatLastCommit", () => {
  const twoSecondsAgo = new Date(new Date().getTime() - 2 * 1000).toISOString();
  const twoMinutesAgo = new Date(new Date().getTime() - 2 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(new Date().getTime() - 2 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(new Date().getTime() - 2 * 7 * 24 * 60 * 60 * 1000).toISOString();

  expect(formatLastCommit(twoSecondsAgo)).toBe("Just now");
  expect(formatLastCommit(twoMinutesAgo)).toBe("2 minutes ago");
  expect(formatLastCommit(twoHoursAgo)).toBe("2 hours ago");
  expect(formatLastCommit(twoDaysAgo)).toBe("2 days ago");
  expect(formatLastCommit(twoWeeksAgo)).toBe("2 weeks ago");

  const oneSecondAgo = new Date(new Date().getTime() - 1 * 1000).toISOString();
  const oneMinuteAgo = new Date(new Date().getTime() - 1 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(new Date().getTime() - 1 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const oneWeekAgo = new Date(new Date().getTime() - 1 * 7 * 24 * 60 * 60 * 1000).toISOString();

  expect(formatLastCommit(oneSecondAgo)).toBe("Just now");
  expect(formatLastCommit(oneMinuteAgo)).toBe("1 minute ago");
  expect(formatLastCommit(oneHourAgo)).toBe("1 hour ago");
  expect(formatLastCommit(oneDayAgo)).toBe("1 day ago");
  expect(formatLastCommit(oneWeekAgo)).toBe("1 week ago");
});
