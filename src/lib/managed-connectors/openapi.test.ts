import { afterEach, describe, expect, it, vi } from "vitest";

import {
  generateManagedConnectorFunctionsFromOpenApi,
  generateManagedConnectorToolsFromOpenApi,
} from "@/src/lib/managed-connectors/openapi";

const stubOpenApiResponse = (document: unknown, status = 200) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify(document), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
};

const notionStyleDocument = {
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
  it("maps path, query, and fixed header parameters into HTTP request templates", async () => {
    stubOpenApiResponse(notionStyleDocument);

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
    stubOpenApiResponse(notionStyleDocument);

    const tools = await generateManagedConnectorToolsFromOpenApi({
      openApiUrl: "https://developers.notion.com/openapi.json",
      authStrategy: "oauth2",
    });
    const search = tools.find((tool) => tool.name === "post_search");

    expect(search).toMatchObject({
      request: {
        method: "POST",
        path: "/v1/search",
        headers: {
          "Notion-Version": "2026-03-11",
        },
        body: "{{body}}",
        contentType: "json",
      },
    });
    expect(search?.description).toContain("Provide the request payload under `body`");
    expect(search?.description).toContain("query (required)");
    expect(search?.description).toContain("page_size");
  });

  it("keeps supported multipart operations and filters out incompatible auth operations", async () => {
    stubOpenApiResponse(notionStyleDocument);

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
        method: "POST",
        path: "/v1/file_uploads/{{file_upload_id}}/send",
        body: "{{body}}",
        contentType: "multipart_form_data",
      },
    });
  });

  it("supports form, text, array, and fallback tool naming for non-bearer auth", async () => {
    stubOpenApiResponse({
      openapi: "3.1.0",
      components: {
        requestBodies: {
          noteText: {
            content: {
              "text/plain": {
                schema: { type: "string" },
              },
            },
          },
        },
      },
      paths: {
        "/v1/forms": {
          post: {
            operationId: " submit-form ",
            description: "Submit form",
            parameters: [
              {
                name: "verbose",
                in: "query",
                schema: { type: "boolean" },
              },
              {
                name: "X-Trace-Id",
                in: "header",
                schema: { enum: ["trace-123"] },
              },
              {
                name: "Authorization",
                in: "header",
                schema: { enum: ["Bearer fixed"] },
              },
              {
                name: "X-Mode",
                in: "header",
                schema: { enum: ["sync", "async"] },
              },
            ],
            requestBody: {
              content: {
                "application/x-www-form-urlencoded": {
                  schema: { type: "object" },
                },
              },
            },
          },
        },
        "/v1/notes/{note_id}": {
          put: {
            operationId: "replace-note",
            description: "Replace note",
            parameters: [
              {
                name: "note_id",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            requestBody: { $ref: "#/components/requestBodies/noteText" },
          },
        },
        "/v1/items": {
          patch: {
            summary: "Patch items",
            requestBody: {
              content: {
                "application/json": {
                  schema: { type: "array", items: { type: "object" } },
                },
              },
            },
          },
        },
        "/v1/fallback": {
          get: {
            operationId: "!!!",
          },
        },
      },
    });

    const tools = await generateManagedConnectorToolsFromOpenApi({
      openApiUrl: "https://api.example.test/openapi.json",
      authStrategy: "api_key",
    });

    expect(tools).toEqual([
      {
        name: "submit_form",
        description:
          "Submit form Query params: verbose. Provide form fields under `body`.",
        defaultScopes: [],
        request: {
          method: "POST",
          path: "/v1/forms",
          query: {
            verbose: "{{verbose}}",
          },
          headers: {
            "X-Trace-Id": "trace-123",
          },
          body: "{{body}}",
          contentType: "form_urlencoded",
        },
      },
      {
        name: "replace_note",
        description:
          "Replace note Path params: note_id (required). Provide the plain-text request payload under `body`.",
        defaultScopes: [],
        request: {
          method: "PUT",
          path: "/v1/notes/{{note_id}}",
          query: undefined,
          headers: undefined,
          body: "{{body}}",
          contentType: "text",
        },
      },
      {
        name: "patch_v1_items",
        description: "Patch items Provide the request payload array under `body`.",
        defaultScopes: [],
        request: {
          method: "PATCH",
          path: "/v1/items",
          query: undefined,
          headers: undefined,
          body: "{{body}}",
          contentType: "json",
        },
      },
      {
        name: "call_api",
        description: "HTTP API operation",
        defaultScopes: [],
        request: {
          method: "GET",
          path: "/v1/fallback",
          query: undefined,
          headers: undefined,
          body: undefined,
          contentType: undefined,
        },
      },
    ]);
  });

  it("accepts bearer-auth connectors when an operation omits security requirements", async () => {
    stubOpenApiResponse({
      openapi: "3.1.0",
      paths: {
        "/v1/public": {
          get: {
            summary: "List public records",
          },
        },
      },
    });

    await expect(
      generateManagedConnectorFunctionsFromOpenApi({
        openApiUrl: "https://api.example.test/public-openapi.json",
        authStrategy: "bearer",
      }),
    ).resolves.toEqual([
      {
        name: "get_v1_public",
        description: "List public records",
        defaultScopes: [],
        request: {
          method: "GET",
          path: "/v1/public",
        },
      },
    ]);
  });

  it("skips operations with unsupported auth or request bodies and errors when none remain", async () => {
    stubOpenApiResponse({
      openapi: "3.1.0",
      security: [{ basicAuth: [] }],
      paths: {
        "/v1/secure": {
          post: {
            summary: "Create secure record",
            requestBody: {
              content: {
                "application/json": {
                  schema: { type: "object" },
                },
              },
            },
          },
        },
        "/v1/xml": {
          post: {
            summary: "Submit XML payload",
            security: [],
            requestBody: {
              content: {
                "application/xml": {
                  schema: { type: "object" },
                },
              },
            },
          },
        },
      },
    });

    await expect(
      generateManagedConnectorToolsFromOpenApi({
        openApiUrl: "https://api.example.test/unsupported-openapi.json",
        authStrategy: "bearer",
      }),
    ).rejects.toThrow(
      "OpenAPI schema at https://api.example.test/unsupported-openapi.json did not produce any supported HTTP tools.",
    );
  });

  it("fails when the OpenAPI schema cannot be fetched", async () => {
    stubOpenApiResponse({ detail: "not found" }, 404);

    await expect(
      generateManagedConnectorToolsFromOpenApi({
        openApiUrl: "https://api.example.test/missing-openapi.json",
        authStrategy: "api_key",
      }),
    ).rejects.toThrow(
      "Failed to load OpenAPI schema from https://api.example.test/missing-openapi.json (404).",
    );
  });

  it("fails when the OpenAPI document does not define any paths", async () => {
    stubOpenApiResponse({ openapi: "3.1.0", info: { title: "Broken API" } });

    await expect(
      generateManagedConnectorToolsFromOpenApi({
        openApiUrl: "https://api.example.test/no-paths.json",
        authStrategy: "api_key",
      }),
    ).rejects.toThrow(
      "OpenAPI schema at https://api.example.test/no-paths.json does not contain any paths.",
    );
  });

  it("fails on unsupported external OpenAPI references", async () => {
    stubOpenApiResponse({
      openapi: "3.1.0",
      paths: {
        "/v1/external-ref": {
          get: {
            summary: "External reference",
            parameters: [{ $ref: "https://example.com/openapi.json#/components/parameters/id" }],
          },
        },
      },
    });

    await expect(
      generateManagedConnectorToolsFromOpenApi({
        openApiUrl: "https://api.example.test/external-ref.json",
        authStrategy: "api_key",
      }),
    ).rejects.toThrow(
      "Unsupported OpenAPI reference 'https://example.com/openapi.json#/components/parameters/id'.",
    );
  });

  it("fails on unresolved local OpenAPI references", async () => {
    stubOpenApiResponse({
      openapi: "3.1.0",
      components: {
        requestBodies: {},
      },
      paths: {
        "/v1/unresolved-ref": {
          post: {
            summary: "Unresolved reference",
            requestBody: { $ref: "#/components/requestBodies/missing" },
          },
        },
      },
    });

    await expect(
      generateManagedConnectorToolsFromOpenApi({
        openApiUrl: "https://api.example.test/unresolved-ref.json",
        authStrategy: "api_key",
      }),
    ).rejects.toThrow(
      "Could not resolve OpenAPI reference '#/components/requestBodies/missing'.",
    );
  });
});
