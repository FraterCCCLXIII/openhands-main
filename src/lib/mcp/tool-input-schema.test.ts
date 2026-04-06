import { describe, expect, it } from "vitest";

import { buildContextLayerToolInputShape } from "@/src/lib/mcp/tool-input-schema";
import type { ToolSpec } from "@/src/types/context-layer";

const buildToolSpec = (overrides?: Partial<ToolSpec>): ToolSpec => ({
  name: "create_post",
  description: "Create a post",
  enabled: true,
  fineGrainedPermissions: false,
  defaultScopes: [],
  executionMode: "provider",
  config: {},
  ...overrides,
});

describe("buildContextLayerToolInputShape", () => {
  it("merges MCP input schemas, request-template variables, and reserved context overrides", () => {
    const shape = buildContextLayerToolInputShape(
      buildToolSpec({
        config: {
          inputSchema: {
            type: "object",
            required: ["title", "body"],
            properties: {
              title: { type: "string", description: "Post title" },
              body: { type: "string" },
              status: { type: "string", enum: ["draft", "published"] },
              publish: { type: "boolean" },
              labels: { type: "array", items: { type: "string" } },
            },
          },
          request: {
            method: "POST",
            path: "/posts/{{path.postId}}",
            query: {
              preview: "{{query.preview}}",
            },
            headers: {
              "x-trace": "{{headers.traceId}}",
            },
            body: {
              title: "{{body.title}}",
              body: "{{body.body}}",
            },
          },
        },
      }),
    );

    const parsed = shape.parse({
      title: "Hello",
      body: "World",
      status: "draft",
      publish: true,
      labels: ["release"],
      path: { postId: "post-123" },
      query: { preview: "1" },
      headers: { traceId: "trace-abc" },
      contextScopes: ["posts.write"],
      contextAgentId: "agent-42",
      contextAgentClass: "writer",
    });

    expect(parsed).toMatchObject({
      title: "Hello",
      body: "World",
      status: "draft",
      publish: true,
      labels: ["release"],
      path: { postId: "post-123" },
      query: { preview: "1" },
      headers: { traceId: "trace-abc" },
      contextScopes: ["posts.write"],
      contextAgentId: "agent-42",
      contextAgentClass: "writer",
    });

    expect(() =>
      shape.parse({
        body: "Missing title",
        path: { postId: "post-123" },
      }),
    ).toThrow();
    expect(() =>
      shape.parse({
        title: "Hello",
        body: "World",
        status: "archived",
        path: { postId: "post-123" },
      }),
    ).toThrow();
  });

  it("returns a permissive reserved-only shape when no provider schema is available", () => {
    const shape = buildContextLayerToolInputShape(buildToolSpec());

    const parsed = shape.parse({
      arbitrary: { nested: true },
      contextAgentId: "agent-99",
      contextScopes: ["scope.read"],
    });

    expect(parsed).toEqual({
      arbitrary: { nested: true },
      contextAgentId: "agent-99",
      contextScopes: ["scope.read"],
    });
  });
});
