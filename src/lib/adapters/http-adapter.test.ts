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
    functions: {},
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
});
