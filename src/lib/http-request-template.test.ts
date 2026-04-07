import { describe, expect, it } from "vitest";

import {
  collectHttpTemplateValidationIssues,
  collectHttpTemplateVariables,
  formatHttpTemplateLocation,
} from "@/src/lib/http-request-template";
import { managedConnectorUpsertSchema } from "@/src/lib/managed-connectors/api-schema";

describe("http request template helpers", () => {
  it("collects variables from supported path and whole-value placeholders", () => {
    const variables = [...
      collectHttpTemplateVariables({
        method: "POST",
        path: "/v1/pages/{{path.pageId}}/blocks/{{path.blockId}}",
        query: {
          filter_properties: "{{query.filterProperties}}",
          literal: "keep-me",
        },
        headers: {
          "x-trace-id": "{{headers.traceId}}",
          "x-static": "always",
        },
        body: {
          page: "{{body.page}}",
          nested: ["{{body.children}}", { note: "static" }],
        },
      }),
    ];

    expect(variables).toEqual([
      "path.pageId",
      "path.blockId",
      "query.filterProperties",
      "headers.traceId",
      "body.page",
      "body.children",
    ]);
  });

  it("flags mixed interpolation outside request paths", () => {
    expect(
      collectHttpTemplateValidationIssues({
        method: "GET",
        path: "/v1/pages/{{pageId}}",
        query: {
          search: "title:{{query.term}}",
        },
        headers: {
          authorization: "Bearer {{headers.token}}",
        },
        body: {
          blocks: ["hello {{body.name}}"],
        },
      }),
    ).toEqual([
      {
        path: ["query", "search"],
        message:
          "Only whole-value `{{variable}}` placeholders are allowed outside request paths.",
      },
      {
        path: ["headers", "authorization"],
        message:
          "Only whole-value `{{variable}}` placeholders are allowed outside request paths.",
      },
      {
        path: ["body", "blocks", 0],
        message:
          "Only whole-value `{{variable}}` placeholders are allowed outside request paths.",
      },
    ]);
  });

  it("flags malformed request-path placeholders", () => {
    expect(
      collectHttpTemplateValidationIssues({
        method: "GET",
        path: "/v1/pages/{{path.pageId}",
      }),
    ).toEqual([
      {
        path: ["path"],
        message: "Request paths may only use complete `{{variable}}` placeholders.",
      },
    ]);
  });

  it("returns empty results for missing templates and formats issue paths", () => {
    expect(collectHttpTemplateValidationIssues()).toEqual([]);
    expect([...collectHttpTemplateVariables()]).toEqual([]);
    expect(formatHttpTemplateLocation(["body", "blocks", 0, "text"])).toBe(
      "body.blocks[0].text",
    );
  });

  it("rejects unsupported mixed interpolation through managed connector validation", () => {
    expect(() =>
      managedConnectorUpsertSchema.parse({
        slug: "example",
        name: "Example",
        description: "Example connector",
        provider: "http",
        authStrategy: "none",
        credentialLabel: "None",
        credentialPlaceholder: "None",
        credentialHelp: "No credentials required",
        apiBaseUrl: "https://api.example.com",
        tools: [
          {
            name: "search",
            description: "Search examples",
            defaultScopes: [],
            request: {
              method: "GET",
              path: "/v1/search",
              query: {
                q: "before:{{query.term}}",
              },
            },
          },
        ],
      }),
    ).toThrow(/Only whole-value `\{\{variable\}\}` placeholders are allowed outside request paths\./);
  });
});
