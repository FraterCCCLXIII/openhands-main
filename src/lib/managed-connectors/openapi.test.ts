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

const stubOpenApiFetch = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify(openApiDocument), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("generateManagedConnectorToolsFromOpenApi", () => {
  it("maps path, query, and fixed header parameters into HTTP request templates", async () => {
    stubOpenApiFetch();

    const tools = await generateManagedConnectorToolsFromOpenApi({
      openApiUrl: "https://developers.notion.com/openapi.json",
      authStrategy: "oauth2",
    });
    const retrievePage = tools.find((tool) => tool.name === "retrieve_a_page");

    expect(retrievePage).toMatchObject({
      description:
        "Retrieve a page Path params: page_id (required). Query params: filter_properties.",
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
    });
  });

  it("describes JSON request bodies without depending on the entire generated payload", async () => {
    stubOpenApiFetch();

    const tools = await generateManagedConnectorToolsFromOpenApi({
      openApiUrl: "https://developers.notion.com/openapi.json",
      authStrategy: "oauth2",
    });
    const search = tools.find((tool) => tool.name === "post_search");

    expect(search).toMatchObject({
      request: {
        method: "POST",
        path: "/v1/search",
        body: "{{body}}",
        contentType: "json",
      },
    });
    expect(search?.description).toContain("Provide the request payload under `body`");
    expect(search?.description).toContain("query (required)");
    expect(search?.description).toContain("page_size");
  });

  it("keeps supported multipart operations and filters out incompatible auth operations", async () => {
    stubOpenApiFetch();

    const tools = await generateManagedConnectorToolsFromOpenApi({
      openApiUrl: "https://developers.notion.com/openapi.json",
      authStrategy: "oauth2",
    });

    expect(tools.map((tool) => tool.name)).toEqual([
      "retrieve_a_page",
      "post_search",
      "upload_file",
    ]);
    expect(tools.find((tool) => tool.name === "upload_file")).toMatchObject({
      request: {
        path: "/v1/file_uploads/{{file_upload_id}}/send",
        body: "{{body}}",
        contentType: "multipart_form_data",
      },
    });
  });
});
