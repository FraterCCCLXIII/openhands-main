import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/managed-connectors/openapi", () => {
  it("returns an OpenAPI-compatible document for the managed connectors API", async () => {
    const response = await GET(
      new Request("http://localhost:3000/api/managed-connectors/openapi"),
    );

    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      openapi: string;
      servers: Array<{ url: string }>;
      paths: Record<string, unknown>;
      components: { schemas: Record<string, unknown> };
    };

    expect(body.openapi).toBe("3.0.3");
    expect(body.servers).toEqual([{ url: "http://localhost:3000" }]);
    expect(body.paths["/api/managed-connectors"]).toMatchObject({
      get: expect.any(Object),
      post: expect.objectContaining({
        requestBody: expect.objectContaining({
          required: true,
        }),
      }),
    });
    expect(body.components.schemas.ManagedConnectorUpsert).toBeTruthy();
    expect(body.components.schemas.ManagedConnector).toBeTruthy();
    expect(body.components.schemas.ErrorResponse).toBeTruthy();
  });
});
