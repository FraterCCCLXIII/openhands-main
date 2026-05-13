import { expect, test } from "vitest";
import { loader } from "../../src/routes/blog.$slug";

test("blog loader resolves synced live slugs", () => {
  const data = loader({
    params: { slug: "agent-control-plane" },
    request: new Request("https://example.com/blog/agent-control-plane"),
  } as never);

  expect(data.title).toBe("The Software Agent Control Plane");
  expect(data.coverAlt).toBe("The Software Agent Control Plane cover image");
  expect(data.url).toBe("https://example.com/blog/agent-control-plane");
});

test("blog loader resolves canonical ACP slugs without redirecting away", () => {
  const data = loader({
    params: { slug: "20251209-use-openhands-in-your-ide-with-acp" },
    request: new Request(
      "https://example.com/blog/20251209-use-openhands-in-your-ide-with-acp"
    ),
  } as never);

  expect(data.title).toBe(
    "Use AI Agents in Your Favorite Editor through the Agent Client Protocol"
  );
  expect(data.seoTitleDate).toBe("Dec 09, 2025");
});

test("blog loader preserves live title dates via seoTitleDate metadata", () => {
  const data = loader({
    params: { slug: "20251119-amd-ryzen-ai-collaboration" },
    request: new Request("https://example.com/blog/20251119-amd-ryzen-ai-collaboration"),
  } as never);

  expect(data.seoTitleDate).toBe("Nov 17, 2025");
});

test("blog loader redirects unknown live-only slugs to openhands.dev", () => {
  try {
    loader({
      params: { slug: "does-not-exist" },
      request: new Request("https://example.com/blog/does-not-exist"),
    } as never);
    throw new Error("Expected loader to throw for a missing blog slug");
  } catch (error) {
    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(302);
    expect((error as Response).headers.get("Location")).toBe(
      "https://openhands.dev/blog/does-not-exist"
    );
  }
});
