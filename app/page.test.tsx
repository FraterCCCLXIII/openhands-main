// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const { authMock } = vi.hoisted(() => ({
  authMock: vi.fn(async () => ({ user: { email: "user@example.com" } })),
}));

vi.mock("@/src/lib/auth", () => ({
  auth: authMock,
}));

import HomePage from "./page";

const renderDocument = async () =>
  new DOMParser().parseFromString(renderToStaticMarkup(await HomePage()), "text/html");

const getHeading = (document: Document, level: 1 | 2, text: string) =>
  Array.from(document.querySelectorAll(`h${level}`)).find(
    (heading) => heading.textContent?.trim() === text,
  );

afterEach(() => {
  vi.unstubAllEnvs();
  authMock.mockReset();
  authMock.mockResolvedValue({ user: { email: "user@example.com" } });
});

describe("HomePage", () => {
  it("shows a generic service unavailable screen to signed-in non-admin users when storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");

    const document = await renderDocument();

    expect(getHeading(document, 1, "Service unavailable")).toBeTruthy();
    expect(document.body.textContent).toContain(
      "Please contact your administrator and try again later.",
    );
    expect(getHeading(document, 2, "How to set up the database")).toBeFalsy();
  });

  it("shows setup instructions to signed-in admins when storage is unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");
    authMock.mockResolvedValue({ user: { email: "admin@example.com" } });

    const document = await renderDocument();

    expect(getHeading(document, 1, "Service unavailable")).toBeTruthy();
    expect(getHeading(document, 2, "How to set up the database")).toBeTruthy();
    const codeValues = Array.from(document.querySelectorAll("code")).map((node) => node.textContent?.trim());
    expect(codeValues).toContain("POSTGRES_URL");
    expect(codeValues).toContain("DATABASE_URL");
  });

  it("links signed-in users to the /integrations dashboard route", async () => {
    const document = await renderDocument();
    const dashboardLink = document.querySelector('a[href="/integrations"]');

    expect(dashboardLink).toBeTruthy();
    expect(dashboardLink?.textContent).toContain("Open dashboard");
  });
});
