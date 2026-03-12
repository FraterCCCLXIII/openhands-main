import { describe, expect, it } from "vitest";

import { DEFAULT_AGENT_CLASS, DEFAULT_AGENT_ID } from "@/src/lib/agent-defaults";
import { contextInvokeSchema } from "@/src/lib/core/schema";

describe("contextInvokeSchema", () => {
  it("defaults the invocation identity when agentId and agentClass are omitted", () => {
    expect(
      contextInvokeSchema.parse({
        payload: {
          query: "hello",
        },
      }),
    ).toEqual({
      agentId: DEFAULT_AGENT_ID,
      agentClass: DEFAULT_AGENT_CLASS,
      scopes: [],
      payload: {
        query: "hello",
      },
    });
  });
});
