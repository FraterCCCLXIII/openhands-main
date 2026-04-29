import { describe, expect, test } from "vitest";
import { blogAPI, getBlogSlug } from "../../src/api/blog";

const regressionSlugs = [
  "20251119-amd-ryzen-ai-collaboration",
  "20251202-agents-in-the-outer-loop",
  "20251209-use-openhands-in-your-ide-with-acp",
  "20251218-cobol-to-java-refactoring",
  "20251218-openhands-toad-collaboration",
  "20260216-swefficiency-benchmark",
  "20260219-velocity-is-dead",
  "20260227-creating-effective-agent-skills",
  "20260303-vulnerability-fixer",
  "20260305-learning-to-verify-ai-generated-code",
  "agent-control-plane",
  "agentic-coding-vs-code-completion",
  "analyzing-and-improving-openhands-index",
  "eight-billion-tokens-in-two-weeks-how-c3-ai-brings-agentic-coding-to-every-team-with-openhands",
  "evaluating-agent-skills",
  "evoclaw-benchmark",
  "introducing-openhands-lm-32b-a-strong-open-coding-agent-model",
  "minimax-m2-5-open-weights-models-catch-up-to-claude",
  "openhands-index",
  "openhands-product-update---march-2026",
  "weve-just-raised-18-8m-to-build-the-open-standard-for-autonomous-software-development",
] as const;

describe("blogAPI", () => {
  test.each(regressionSlugs)("resolves live slug %s", (slug) => {
    const blog = blogAPI.getBlogBySlug(slug);

    expect(blog, `${slug} should resolve`).toBeDefined();
    expect(getBlogSlug(blog!)).toBe(slug);
  });

  test("preserves aliases for previously title-derived slugs", () => {
    expect(
      blogAPI.getBlogBySlug("introducing-openhands-lm-32b----a-strong-open-coding-agent-model"),
    ).toBeDefined();
    expect(
      blogAPI.getBlogBySlug("use-ai-agents-in-your-favorite-editor-through-the-agent-client-protocol"),
    ).toBeDefined();
  });

  test("filters unpublished posts out of the public inventory", () => {
    expect(
      blogAPI.getAllBlogs().some(
        (blog) =>
          blog.data.title === "Levels of Autonomy in AI-enhanced Software Engineering",
      ),
    ).toBe(false);
    expect(
      blogAPI.getBlogBySlug(
        "levels-of-autonomy-in-ai-enhanced-software-engineering",
      ),
    ).toBeUndefined();
  });
});
