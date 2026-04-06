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

  it("builds JSON requests from nested templates and oauth2 credentials", async () => {
    const input = buildInput();
    input.integration.authStrategy = "oauth2";
    input.integration.credentials = {
      accessToken: "oauth-token",
    };
    input.toolSpec.config.request = {
      method: "post",
      path: "/v1/messages/{{meta.id}}",
      query: {
        search: "{{filters.query}}",
        count: "{{meta.count}}",
        skip: "{{filters.missing}}",
      },
      headers: {
        "X-Trace": "trace-{{meta.id}}",
        "X-Count": "{{meta.count}}",
        "X-Skip": "{{filters.missing}}",
      },
      body: {
        prompt: "Hello {{user.name}}",
        config: "{{config}}",
        nested: {
          id: "{{meta.id}}",
          skip: "{{filters.missing}}",
        },
        items: ["{{user.name}}", "{{filters.missing}}"],
      },
    };
    input.payload = {
      user: { name: "Ada" },
      meta: { id: "msg-42", count: 3 },
      filters: { query: "hello" },
      config: { voice: "nova" },
    };

    const fetchMock = vi.fn(async (url: URL | string, init?: RequestInit) => {
      const requestUrl = new URL(url.toString());
      expect(requestUrl.toString()).toBe(
        "https://api.elevenlabs.io/v1/messages/msg-42?search=hello&count=3",
      );
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({
        Authorization: "Bearer oauth-token",
        "X-Trace": "trace-msg-42",
        "X-Count": "3",
        "Content-Type": "application/json",
      });
      expect(init?.headers).not.toHaveProperty("X-Skip");
      expect(init?.body).toBe(
        JSON.stringify({
          prompt: "Hello Ada",
          config: { voice: "nova" },
          nested: { id: "msg-42" },
          items: ["Ada"],
        }),
      );

      return new Response(JSON.stringify({ ok: true, id: "msg-42" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAdapter();
    await expect(adapter.invoke(input)).resolves.toEqual({ ok: true, id: "msg-42" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("omits request bodies for HEAD requests and returns null for 204 responses", async () => {
    const input = buildInput();
    input.integration.authStrategy = "bearer";
    input.integration.credentials = {
      accessToken: "bearer-token",
    };
    input.toolSpec.config.request = {
      method: "HEAD",
      path: "/v1/status",
      body: { ignored: true },
      contentType: "text",
    };

    const fetchMock = vi.fn(async (_url: URL | string, init?: RequestInit) => {
      expect(init?.method).toBe("HEAD");
      expect(init?.headers).toMatchObject({
        Authorization: "Bearer bearer-token",
        "Content-Type": "text/plain",
      });
      expect(init?.body).toBeUndefined();
      return new Response(null, { status: 204 });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAdapter();
    await expect(adapter.invoke(input)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("encodes form bodies and basic auth credentials", async () => {
    const input = buildInput();
    input.integration.authStrategy = "basic";
    input.integration.credentials = {
      username: "client-id",
      password: "client-secret",
    };
    input.toolSpec.config.request = {
      method: "POST",
      path: "/oauth/token",
      body: {
        grant_type: "client_credentials",
        scope: "read write",
        ignored: "{{missing}}",
      },
      contentType: "form_urlencoded",
    };
    input.payload = {};

    const fetchMock = vi.fn(async (_url: URL | string, init?: RequestInit) => {
      expect(init?.headers).toMatchObject({
        Authorization: `Basic ${Buffer.from("client-id:client-secret").toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      });
      expect(init?.body).toBe("grant_type=client_credentials&scope=read+write");

      return new Response("<token>ok</token>", {
        status: 200,
        headers: { "Content-Type": "application/xml" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAdapter();
    await expect(adapter.invoke(input)).resolves.toBe("<token>ok</token>");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips non-record query and header templates and stringifies text request bodies", async () => {
    const input = buildInput();
    input.integration.authStrategy = "basic";
    input.integration.credentials = {
      username: "client-id",
    };
    input.toolSpec.config.request = {
      method: "POST",
      path: "/notes",
      query: "{{queryString}}" as never,
      headers: "{{headerString}}" as never,
      body: {
        note: "hello",
      },
      contentType: "text",
    };
    input.payload = {
      queryString: "not-a-record",
      headerString: "not-a-record",
    };

    const fetchMock = vi.fn(async (url: URL | string, init?: RequestInit) => {
      expect(url.toString()).toBe("https://api.elevenlabs.io/notes");
      expect(init?.headers).toEqual({
        "Content-Type": "text/plain",
      });
      expect(init?.body).toBe(JSON.stringify({ note: "hello" }));

      return new Response("accepted", {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAdapter();
    await expect(adapter.invoke(input)).resolves.toBe("accepted");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("skips null query and form values when exact templates resolve to records", async () => {
    const input = buildInput();
    input.integration.authStrategy = "none";
    input.integration.credentials = {};
    input.toolSpec.config.request = {
      method: "POST",
      path: "/search",
      query: "{{query}}" as never,
      body: "{{formBody}}",
      contentType: "form_urlencoded",
    };
    input.payload = {
      query: {
        keep: "yes",
        skip: null,
      },
      formBody: {
        grant_type: "client_credentials",
        skip: null,
      },
    };

    const fetchMock = vi.fn(async (url: URL | string, init?: RequestInit) => {
      expect(url.toString()).toBe("https://api.elevenlabs.io/search?keep=yes");
      expect(init?.headers).toEqual({
        "Content-Type": "application/x-www-form-urlencoded",
      });
      expect(init?.body).toBe("grant_type=client_credentials");

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

  it("omits request bodies and content headers when a template resolves to undefined", async () => {
    const input = buildInput();
    input.integration.authStrategy = "none";
    input.integration.credentials = {};
    input.toolSpec.config.request = {
      method: "POST",
      path: "/v1/optional-body",
      body: "{{missingBody}}",
    };
    input.payload = {};

    const fetchMock = vi.fn(async (_url: URL | string, init?: RequestInit) => {
      expect(init?.headers).toEqual({});
      expect(init?.body).toBeUndefined();

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

  it("encodes multipart arrays, blobs, base64 uploads, text fields, and fallback values", async () => {
    const input = buildInput();
    input.toolSpec.config.request = {
      method: "POST",
      path: "/v1/uploads",
      body: "{{body}}",
      contentType: "multipart_form_data",
    };
    input.payload = {
      body: {
        attachments: [
          new Blob(["first"], { type: "text/plain" }),
          {
            contentBase64: Buffer.from("second").toString("base64"),
            filename: "second.bin",
            contentType: "application/octet-stream",
          },
          { text: "third" },
          { nested: true },
          7,
          null,
        ],
        comment: { text: "plain text field" },
        metadata: { extra: true },
      },
    };

    const fetchMock = vi.fn(async (_url: URL | string, init?: RequestInit) => {
      expect(init?.body).toBeInstanceOf(FormData);

      const formData = init?.body as FormData;
      const attachments = formData.getAll("attachments");
      expect(attachments).toHaveLength(5);
      expect(attachments[0]).toBeInstanceOf(File);
      expect(await (attachments[0] as File).text()).toBe("first");
      expect(attachments[1]).toBeInstanceOf(File);
      expect((attachments[1] as File).name).toBe("second.bin");
      expect(await (attachments[1] as File).text()).toBe("second");
      expect(attachments[2]).toBe("third");
      expect(attachments[3]).toBe(JSON.stringify({ nested: true }));
      expect(attachments[4]).toBe("7");
      expect(formData.get("comment")).toBe("plain text field");
      expect(formData.get("metadata")).toBe(JSON.stringify({ extra: true }));

      return new Response(JSON.stringify({ uploaded: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAdapter();
    await expect(adapter.invoke(input)).resolves.toEqual({ uploaded: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to application/octet-stream for binary responses without a content type", async () => {
    const input = buildInput();
    input.integration.authStrategy = "none";
    input.integration.credentials = {};
    input.toolSpec.config.request = {
      method: "POST",
      path: "/v1/raw",
      body: {
        ok: true,
      },
    };

    const fetchMock = vi.fn(async (_url: URL | string, init?: RequestInit) => {
      expect(init?.headers).toEqual({
        "Content-Type": "application/json",
      });
      return new Response(Buffer.from("raw-bytes"), {
        status: 200,
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAdapter();
    await expect(adapter.invoke(input)).resolves.toEqual({
      contentType: "application/octet-stream",
      contentDisposition: undefined,
      sizeBytes: Buffer.byteLength("raw-bytes"),
      contentBase64: Buffer.from("raw-bytes").toString("base64"),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws validation errors for missing config, missing request templates, and invalid paths", async () => {
    const adapter = new HttpAdapter();

    const missingBaseUrl = buildInput();
    missingBaseUrl.integration.config = {};
    await expect(adapter.invoke(missingBaseUrl)).rejects.toMatchObject({
      statusCode: 400,
      message: "Integration 'elevenlabs' is missing an apiBaseUrl configuration.",
    });

    const missingRequest = buildInput();
    missingRequest.toolSpec.config = {};
    await expect(adapter.invoke(missingRequest)).rejects.toMatchObject({
      statusCode: 400,
      message: "Tool 'speech_to_text' is missing an HTTP request template.",
    });

    const invalidPath = buildInput();
    invalidPath.toolSpec.config.request = {
      method: "POST",
      path: "{{missing.path}}",
    };
    invalidPath.payload = {};
    await expect(adapter.invoke(invalidPath)).rejects.toMatchObject({
      statusCode: 400,
      message: "Tool 'speech_to_text' produced an invalid request path.",
    });
  });

  it("normalizes downstream HTTP errors using response detail when available", async () => {
    const fetchMock = vi.fn(async () =>
      new Response("rate limit hit", {
        status: 429,
        statusText: "Too Many Requests",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAdapter();
    await expect(adapter.invoke(buildInput())).rejects.toMatchObject({
      statusCode: 502,
      message: "ElevenLabs speech_to_text failed (429): rate limit hit",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to response status text when downstream errors return an empty body", async () => {
    const fetchMock = vi.fn(async () =>
      new Response("", {
        status: 503,
        statusText: "Service Unavailable",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const adapter = new HttpAdapter();
    await expect(adapter.invoke(buildInput())).rejects.toMatchObject({
      statusCode: 502,
      message: "ElevenLabs speech_to_text failed (503): Service Unavailable",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
});
