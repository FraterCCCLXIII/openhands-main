import { expect, test } from "vitest";
import { stringToSlug } from "../../src/utils/string-to-slug";

test("stringToSlug", () => {
  expect(stringToSlug("Introducing All Hands AI")).toBe("introducing-all-hands-ai");
  expect(stringToSlug("Levels of Autonomy in AI-enhanced Software Engineering!!:@!@#")).toBe("levels-of-autonomy-in-ai-enhanced-software-engineering");
});
