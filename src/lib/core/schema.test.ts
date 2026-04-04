import { describe, expect, it } from "vitest";

import { contextInvokeSchema } from "@/src/lib/core/schema";

describe("contextInvokeSchema", () => {
  it("defaults the invocation identity to null when agentId and agentClass are omitted", () => {
    expect(
      contextInvokeSchema.parse({
        payload: {
          query: "hello",
        },
      }),
    ).toEqual({
      agentId: null,
      agentClass: null,
      scopes: [],
      payload: {
        query: "hello",
      },
    });
  });
});
