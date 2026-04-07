import { afterEach, describe, expect, it, vi } from "vitest";

import { HttpAdapter } from "@/src/lib/adapters/http-adapter";
import type { AdapterInvocationInput } from "@/src/lib/core/adapter-registry";

const buildInput = (): AdapterInvocationInput => ({
  agentId: "agent-test",
  integration: {
    key: "elevenlabs",
    name: "ElevenLabs",
    kind: "api",
    provider: "http",
    authStrategy: "api_key",
    enabled: true,
    fineGrainedPermissions: false,
    config: {
      apiBaseUrl: "https://api.elevenlabs.io",
    },
    credentials: {
      headerName: "xi-api-key",
      secret: "test-secret",
    },
    tools: {},
  },
  toolSpec: {
    name: "speech_to_text",
    description: "Transcribe uploaded audio.",
    enabled: true,
    fineGrainedPermissions: false,
    defaultScopes: [],
    executionMode: "provider",
    config: {
      request: {
        method: "POST",
        path: "/v1/speech-to-text",
        body: "{{body}}",
        contentType: "multipart_form_data",
      },
    },
  },
  payload: {
    body: {
      model_id: "scribe_v1",
      file: {
        filename: "clip.txt",
        contentType: "text/plain",
        text: "hello world",
      },
    },
  },
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HttpAdapter", () => {
  it("encodes multipart request bodies and preserves binary responses", async () => {
    const fetchMock = vi.fn(async (_url: URL | string, init?: RequestInit) => {
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({
        "xi-api-key": "test-secret",
      });
      expect(init?.body).toBeInstanceOf(FormData);

      const formData = init?.body as FormData;
      expect(formData.get("model_id")).toBe("scribe_v1");

      const file = formData.get("file");
      expect(file).toBeInstanceOf(File);
      expect((file as File).name).toBe("clip.txt");
      expect(await (file as File).text()).toBe("hello world");

      return new Response(Buffer.from("audio-bytes"), {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Disposition": 'attachment; filename="clip.mp3"',
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAdapter();
    const result = (await adapter.invoke(buildInput())) as {
      contentType: string;
      contentDisposition?: string;
      sizeBytes: number;
      contentBase64: string;
    };

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      contentType: "audio/mpeg",
      contentDisposition: 'attachment; filename="clip.mp3"',
      sizeBytes: Buffer.byteLength("audio-bytes"),
      contentBase64: Buffer.from("audio-bytes").toString("base64"),
    });
  });

  it("ignores malformed auth credential values instead of throwing", async () => {
    const input = buildInput();
    input.integration.credentials = {
      headerName: { invalid: true },
      secret: { invalid: true },
    };

    const fetchMock = vi.fn(async (_url: URL | string, init?: RequestInit) => {
      expect(init?.headers).toEqual({});
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAdapter();
    await expect(adapter.invoke(input)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resolves supported path, query, header, and body placeholders", async () => {
    const input = buildInput();
    input.toolSpec.config.request = {
      method: "POST",
      path: "/v1/files/{{path.fileId}}",
      query: {
        tags: "{{query.tags}}",
        include: "{{query.include}}",
        verbose: true,
      },
      headers: {
        "x-trace-id": "{{headers.traceId}}",
        "x-static": "always",
        "x-skip": "{{headers.skip}}",
      },
      body: {
        items: ["{{body.first}}", "{{body.second}}", "static"],
      },
      contentType: "json",
    };
    input.payload = {
      path: {
        fileId: "folder/clip.txt",
      },
      query: {
        tags: ["ready", null, "queued"],
        include: false,
      },
      headers: {
        traceId: 42,
        skip: null,
      },
      body: {
        first: "alpha",
        second: "beta",
      },
    };

    const fetchMock = vi.fn(async (url: URL | string, init?: RequestInit) => {
      const resolvedUrl = url instanceof URL ? url : new URL(url);
      expect(resolvedUrl.pathname).toBe("/v1/files/folder%2Fclip.txt");
      expect(resolvedUrl.searchParams.getAll("tags")).toEqual(["ready", "queued"]);
      expect(resolvedUrl.searchParams.get("include")).toBe("false");
      expect(resolvedUrl.searchParams.get("verbose")).toBe("true");
      expect(init?.headers).toMatchObject({
        "xi-api-key": "test-secret",
        "x-trace-id": "42",
        "x-static": "always",
        "Content-Type": "application/json",
      });
      expect(init?.headers).not.toHaveProperty("x-skip");
      expect(init?.body).toBe(JSON.stringify({
        items: ["alpha", "beta", "static"],
      }));

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAdapter();
    await expect(adapter.invoke(input)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects mixed interpolation outside request paths", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const input = buildInput();
    input.toolSpec.config.request = {
      method: "GET",
      path: "/v1/files/{{path.fileId}}",
      query: {
        search: "status:{{query.term}}",
      },
    };
    input.payload = {
      path: {
        fileId: "folder/clip.txt",
      },
      query: {
        term: "ready",
      },
    };

    const adapter = new HttpAdapter();

    await expect(adapter.invoke(input)).rejects.toThrow(
      /unsupported HTTP request template at query.search/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid path placeholder values", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const input = buildInput();
    input.toolSpec.config.request = {
      method: "GET",
      path: "/v1/files/{{path.fileId}}",
    };
    input.payload = {
      path: {
        fileId: { nested: true },
      },
    };

    const adapter = new HttpAdapter();

    await expect(adapter.invoke(input)).rejects.toThrow(
      /Path placeholder 'path.fileId' must resolve to a string, number, or boolean/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects blank resolved request paths", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const input = buildInput();
    input.toolSpec.config.request = {
      method: "GET",
      path: "   ",
    };
    input.payload = {};

    const adapter = new HttpAdapter();

    await expect(adapter.invoke(input)).rejects.toThrow(/produced an invalid request path/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid resolved query parameter values", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const input = buildInput();
    input.toolSpec.config.request = {
      method: "GET",
      path: "/v1/files",
      query: {
        filter: "{{query.filter}}",
      },
    };
    input.payload = {
      query: {
        filter: { nested: true },
      },
    };

    const adapter = new HttpAdapter();

    await expect(adapter.invoke(input)).rejects.toThrow(
      /produced an invalid query parameter 'filter'/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid resolved header values", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const input = buildInput();
    input.toolSpec.config.request = {
      method: "GET",
      path: "/v1/files",
      headers: {
        "x-meta": "{{headers.meta}}",
      },
    };
    input.payload = {
      headers: {
        meta: { nested: true },
      },
    };

    const adapter = new HttpAdapter();

    await expect(adapter.invoke(input)).rejects.toThrow(
      /produced an invalid header 'x-meta'/,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
