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

  it("supports nullable scalar types, nested objects, and arrays extracted from JSON Schema", () => {
    const shape = buildContextLayerToolInputShape(
      buildToolSpec({
        config: {
          inputSchema: {
            type: "object",
            required: ["count", "price", "enabled", "details"],
            properties: {
              count: { type: "integer" },
              price: { type: ["number", "null"] },
              enabled: { type: "boolean" },
              details: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string" },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
      }),
    );

    expect(
      shape.parse({
        count: 2,
        price: null,
        enabled: true,
        details: {
          name: "enterprise",
          tags: ["crm", "priority"],
        },
      }),
    ).toMatchObject({
      count: 2,
      price: null,
      enabled: true,
      details: {
        name: "enterprise",
        tags: ["crm", "priority"],
      },
    });

    expect(() =>
      shape.parse({
        count: 2.5,
        price: 19.99,
        enabled: true,
        details: { name: "enterprise" },
      }),
    ).toThrow();
    expect(() =>
      shape.parse({
        count: 2,
        price: 19.99,
        enabled: "yes",
        details: { name: "enterprise" },
      }),
    ).toThrow();
  });

  it("falls back to permissive unknown fields for unsupported enums and empty request templates", () => {
    const shape = buildContextLayerToolInputShape(
      buildToolSpec({
        config: {
          inputSchema: {
            type: "object",
            properties: {
              mode: {
                enum: [{ complex: true }, "basic"],
              },
              metadata: {
                type: ["object", "null"],
                properties: {
                  labels: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
              misc: {
                type: "funky",
              },
            },
          },
          request: {
            method: "POST",
            path: "/posts/static",
            body: ["plain-text", { nested: ["still static"] }],
          },
        },
      }),
    );

    expect(
      shape.parse({
        mode: { complex: true },
        metadata: null,
        misc: Symbol.for("unknown"),
      }),
    ).toMatchObject({
      mode: { complex: true },
      metadata: null,
    });
    expect(() =>
      shape.parse({
        metadata: { labels: [1] },
      }),
    ).toThrow();
  });

});
