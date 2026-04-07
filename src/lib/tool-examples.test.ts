import { describe, expect, it } from "vitest";

import {
  buildExamplePayload,
  buildPermissionNote,
  selectExampleIntegration,
} from "@/src/lib/tool-examples";
import type { IntegrationSpec, ToolSpec } from "@/src/types/context-layer";

const buildToolSpec = (overrides?: Partial<ToolSpec>): ToolSpec => ({
  name: "create_page",
  description: "Create a page",
  enabled: true,
  fineGrainedPermissions: true,
  defaultScopes: [],
  executionMode: "provider",
  config: {
    request: {
      method: "POST",
      path: "/v1/pages/{{path.pageId}}",
      query: {
        filter: "{{query.filter}}",
        invalid: "status:{{query.term}}",
      },
      headers: {
        "x-trace-id": "{{headers.traceId}}",
        authorization: "Bearer {{headers.token}}",
      },
      body: {
        content: "{{body.content}}",
        items: ["{{body.items}}", "static"],
      },
    },
  },
  ...overrides,
});

describe("tool examples", () => {
  it("builds example payloads from supported request template placeholders only", () => {
    expect(buildExamplePayload(buildToolSpec())).toEqual({
      body: {
        content: "replace with the value for body.content",
        items: "replace with the value for body.items",
      },
      headers: {
        traceId: "replace with the value for headers.traceId",
      },
      path: {
        pageId: "replace with the value for path.pageId",
      },
      query: {
        filter: "replace with the value for query.filter",
      },
    });
  });

  it("selects the first enabled integration with callable tools and returns default permission guidance", () => {
    const integration: IntegrationSpec = {
      key: "notion",
      name: "Notion",
      kind: "api",
      provider: "http",
      authStrategy: "oauth2",
      enabled: true,
      fineGrainedPermissions: true,
      config: {},
      credentials: {},
      tools: {
        hidden: buildToolSpec({ name: "hidden", enabled: false }),
        create_page: buildToolSpec({ name: "create_page" }),
      },
    };

    expect(selectExampleIntegration([integration])).toEqual({
      integration,
      tools: [integration.tools.create_page],
    });
    expect(buildPermissionNote()).toContain("Enabled tools are callable by default");
  });
});
