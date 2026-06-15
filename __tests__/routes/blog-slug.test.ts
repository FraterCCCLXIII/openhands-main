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
  expect(data.date).toBeTruthy();
});

test("blog loader resolves known live-site aliases", () => {
  const data = loader({
    params: { slug: "20260219-velocity-is-dead" },
    request: new Request("https://example.com/blog/20260219-velocity-is-dead"),
  } as never);

  expect(data.title).toBe(
    "Velocity Is Dead: AI-Generated Compilers and the Future of Software"
  );
  expect(data.date).toBe("2026-02-19T12:00:00.000Z");
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
