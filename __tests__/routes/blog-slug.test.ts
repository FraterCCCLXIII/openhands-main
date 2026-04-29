import { expect, test } from "vitest";
import { loader } from "../../src/routes/blog.$slug";

test("blog loader resolves synced live slugs", () => {
  const data = loader({
    params: { slug: "agent-control-plane" },
    request: new Request("https://example.com/blog/agent-control-plane"),
  } as never);

  expect(data.title).toBe("The Software Agent Control Plane");
  expect(data.url).toBe("https://example.com/blog/agent-control-plane");
});

test("blog loader throws a 404 response for unknown slugs", () => {
  try {
    loader({
      params: { slug: "does-not-exist" },
      request: new Request("https://example.com/blog/does-not-exist"),
    } as never);
    throw new Error("Expected loader to throw for a missing blog slug");
  } catch (error) {
    expect(error).toBeInstanceOf(Response);
    expect((error as Response).status).toBe(404);
    expect((error as Response).statusText).toBe("");
  }
});
