import { afterEach, describe, expect, it, vi } from "vitest";

import { generateManagedConnectorToolsFromOpenApi } from "@/src/lib/managed-connectors/openapi";

const openApiDocument = {
  openapi: "3.1.0",
  security: [{ bearerAuth: [] }],
  components: {
    parameters: {
      apiVersion: {
        name: "Notion-Version",
        in: "header",
        required: true,
        schema: {
          enum: ["2026-03-11"],
        },
      },
    },
  },
  paths: {
    "/v1/pages/{page_id}": {
      get: {
        operationId: "retrieve-a-page",
        summary: "Retrieve a page",
        parameters: [
          {
            name: "page_id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
          {
            name: "filter_properties",
            in: "query",
            schema: { type: "array", items: { type: "string" } },
          },
          { $ref: "#/components/parameters/apiVersion" },
        ],
      },
    },
    "/v1/search": {
      post: {
        operationId: "post-search",
        summary: "Search workspace",
        parameters: [{ $ref: "#/components/parameters/apiVersion" }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  query: { type: "string" },
                  page_size: { type: "number" },
                },
                required: ["query"],
              },
            },
          },
        },
      },
    },
    "/v1/oauth/token": {
      post: {
        operationId: "create-a-token",
        summary: "Create a token",
        security: [{ basicAuth: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
              },
            },
          },
        },
      },
    },
    "/v1/file_uploads/{file_upload_id}/send": {
      post: {
        operationId: "upload-file",
        summary: "Upload a file",
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
              },
            },
          },
        },
      },
    },
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generateManagedConnectorToolsFromOpenApi", () => {
  it("generates HTTP function templates from supported bearer-auth OpenAPI operations", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify(openApiDocument), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const tools = await generateManagedConnectorToolsFromOpenApi({
      openApiUrl: "https://developers.notion.com/openapi.json",
      authStrategy: "oauth2",
    });

    expect(tools).toEqual([
      {
        name: "retrieve_a_page",
        description:
          "Retrieve a page Path params: page_id (required). Query params: filter_properties.",
        defaultScopes: [],
        request: {
          method: "GET",
          path: "/v1/pages/{{page_id}}",
          query: {
            filter_properties: "{{filter_properties}}",
          },
          headers: {
            "Notion-Version": "2026-03-11",
          },
        },
      },
      {
        name: "post_search",
        description:
          "Search workspace Provide the request payload under `body` with fields like query (required), page_size.",
        defaultScopes: [],
        request: {
          method: "POST",
          path: "/v1/search",
          headers: {
            "Notion-Version": "2026-03-11",
          },
          body: "{{body}}",
          contentType: "json",
        },
      },
      {
        name: "upload_file",
        description:
          "Upload a file Provide multipart form fields under `body`. File inputs can use objects like { filename, contentType, contentBase64 }.",
        defaultScopes: [],
        request: {
          method: "POST",
          path: "/v1/file_uploads/{{file_upload_id}}/send",
          body: "{{body}}",
          contentType: "multipart_form_data",
        },
      },
    ]);
  });
});
