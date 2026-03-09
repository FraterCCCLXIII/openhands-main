import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import AddConnectorPage from "./page";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("AddConnectorPage", () => {
  it("falls back to generic admin guidance when ADMIN_EMAIL is not set", () => {
    vi.stubEnv("ADMIN_EMAIL", "");

    const html = renderToStaticMarkup(<AddConnectorPage />);

    expect(html).toContain("contact an admin");
    expect(html).toContain("Popular OAuth-ready provider options");
    expect(html).toContain("How to add a provider that is not currently showing up.");
    expect(html).not.toContain("Submit provider information");
  });

  it("shows the configured admin email when ADMIN_EMAIL is set", () => {
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");

    const html = renderToStaticMarkup(<AddConnectorPage />);

    expect(html).toContain("Contact admin@example.com");
    expect(html).toContain("please contact admin@example.com");
  });

  it("renders users before admins", () => {
    const html = renderToStaticMarkup(<AddConnectorPage />);

    expect(html.indexOf("For users")).toBeLessThan(html.indexOf("For admins"));
  });
});
