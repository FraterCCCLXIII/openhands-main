import { describe, expect, it } from "vitest";
import {
  routeFactoryRequest,
  type RouteContext,
} from "#/utils/factory-routing";

const atlas = { name: "Atlas", role: "conductor" } as const;
const forge = { name: "Forge", role: "worker" } as const;
const sentinel = { name: "Sentinel", role: "verifier" } as const;
const nova = { name: "Nova", role: "scout" } as const;

const context: RouteContext = {
  coordinator: atlas,
  agents: [atlas, forge, sentinel, nova],
  candidates: [
    {
      id: "c1",
      title: "Refactor render scale governor to Rust",
      agentName: "Forge",
      pullRequests: ["412"],
      tickets: ["ENG-42"],
    },
    {
      id: "c2",
      title: "Flaky login tests on the checkout page",
      agentName: "Sentinel",
      pullRequests: [],
      tickets: [],
    },
  ],
};

describe("routeFactoryRequest", () => {
  it("sends to the conversation or pull request that was picked", () => {
    expect(
      routeFactoryRequest(
        "anything",
        { kind: "conversation", conversationId: "c2" },
        context,
      ),
    ).toMatchObject({ kind: "existing", conversationId: "c2", confidence: 1 });
    expect(
      routeFactoryRequest("anything", { kind: "pr", prNumber: "412" }, context),
    ).toMatchObject({ kind: "existing", conversationId: "c1" });
  });

  it("routes a pull request or ticket the text names to its owner", () => {
    expect(
      routeFactoryRequest(
        "Please rebase #412 today",
        { kind: "inbox" },
        context,
      ),
    ).toMatchObject({
      conversationId: "c1",
      reasons: [{ code: "ref", ref: "#412" }],
    });
    expect(
      routeFactoryRequest("Status of ENG-42?", { kind: "inbox" }, context),
    ).toMatchObject({ conversationId: "c1" });
  });

  it("routes by shared words with a conversation in progress", () => {
    const decision = routeFactoryRequest(
      "the checkout login tests are flaky again",
      { kind: "inbox" },
      context,
    );
    expect(decision).toMatchObject({ kind: "existing", conversationId: "c2" });
    expect(decision.reasons[0]).toMatchObject({ code: "similar" });
  });

  it("starts a new conversation with the agent whose role fits when nothing matches", () => {
    expect(
      routeFactoryRequest(
        "Review the new billing schema",
        { kind: "inbox" },
        context,
      ),
    ).toMatchObject({
      kind: "new",
      conversationId: null,
      agentName: "Sentinel",
    });
    expect(
      routeFactoryRequest(
        "Investigate the memory spike",
        { kind: "inbox" },
        context,
      ),
    ).toMatchObject({ kind: "new", agentName: "Nova" });
    expect(
      routeFactoryRequest(
        "Something unrelated entirely",
        { kind: "inbox" },
        context,
      ),
    ).toMatchObject({ kind: "new", agentName: "Forge" });
  });

  it("keeps an agent inbox to that agent's own work", () => {
    // c1 matches the words but belongs to Forge, so Sentinel starts new work.
    expect(
      routeFactoryRequest(
        "refactor the render scale governor",
        { kind: "agent", agentName: "Sentinel" },
        context,
      ),
    ).toMatchObject({ kind: "new", agentName: "Sentinel" });
  });

  it("honours an agent named in the text", () => {
    expect(
      routeFactoryRequest(
        "@Sentinel recheck the login tests on checkout",
        { kind: "inbox" },
        context,
      ),
    ).toMatchObject({
      conversationId: "c2",
      reasons: [{ code: "agent_named", name: "Sentinel" }, { code: "similar" }],
    });
  });
});
