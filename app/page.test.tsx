import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "user@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

import HomePage from "./page";

afterEach(() => {
  vi.unstubAllEnvs();
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "user@example.com" } });
});

describe("HomePage", () => {
  it("shows a generic service unavailable screen to signed-in non-admin users when storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Service unavailable");
    expect(html).toContain("Please contact your administrator and try again later.");
    expect(html).not.toContain("How to set up the database");
  });

  it("shows setup instructions to signed-in admins when storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });

    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain("Service unavailable");
    expect(html).toContain("How to set up the database");
    expect(html).toContain("POSTGRES_URL");
    expect(html).toContain("DATABASE_URL");
  });

  it("links signed-in users to the /home dashboard route", async () => {
    const html = renderToStaticMarkup(await HomePage());

    expect(html).toContain('href="/home"');
    expect(html).toContain("Open dashboard");
  });

});
