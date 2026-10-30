import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MobileSettingsScreen from "#/routes/mobile-settings";

const activeBackendState = vi.hoisted(() => ({
  host: "http://127.0.0.1:18000",
  apiKey: "session-secret",
  name: "Laptop",
}));

vi.mock("#/contexts/active-backend-context", () => ({
  useActiveBackend: () => ({
    backend: {
      kind: "local",
      host: activeBackendState.host,
      apiKey: activeBackendState.apiKey,
      name: activeBackendState.name,
    },
    orgId: null,
  }),
}));

vi.mock("#/utils/mobile-connect-qr", () => ({
  mobileConnectQrDataUrl: async (url: string) => `data:image/png;base64,${btoa(url)}`,
}));

describe("MobileSettingsScreen", () => {
  beforeEach(() => {
    activeBackendState.host = "http://127.0.0.1:18000";
    activeBackendState.apiKey = "session-secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/__oh/connect-tunnel") && init?.method === "POST") {
          return {
            ok: true,
            json: async () => ({ url: "https://abc-123.trycloudflare.com" }),
          };
        }
        return {
          ok: true,
          json: async () => ({ origins: ["http://172.20.0.234:8000"] }),
        };
      }),
    );
  });

  it("opens an internet pairing QR by default", async () => {
    render(<MobileSettingsScreen />);

    await waitFor(() => {
      expect(screen.getByTestId("mobile-connect-host")).toHaveValue(
        "https://abc-123.trycloudflare.com",
      );
    });
    expect(await screen.findByTestId("mobile-connect-qr")).toBeInTheDocument();
  });

  it("refreshes the internet pairing link on demand", async () => {
    const user = userEvent.setup();
    render(<MobileSettingsScreen />);
    await screen.findByTestId("mobile-connect-qr");

    await user.click(screen.getByTestId("mobile-connect-create-link"));
    await waitFor(() => {
      expect(screen.getByTestId("mobile-connect-host")).toHaveValue(
        "https://abc-123.trycloudflare.com",
      );
    });
    expect(screen.getByTestId("mobile-connect-qr")).toBeInTheDocument();
  });

  it("does not offer a QR when the backend has no session key", () => {
    activeBackendState.apiKey = "";
    render(<MobileSettingsScreen />);

    expect(screen.queryByTestId("mobile-connect-show-qr")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-connect-create-link")).not.toBeInTheDocument();
  });
});
