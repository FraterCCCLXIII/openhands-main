import { screen } from "@testing-library/react";
import { renderWithProviders } from "test-utils";
import { describe, expect, it, vi } from "vitest";
import { SidebarAppsList } from "#/components/features/sidebar/sidebar-apps-list";
import translations from "#/i18n/translation.json";

// Resolve keys to their English text so the test sees what people read.
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string) =>
      (translations as Record<string, { en: string }>)[key]?.en ?? key,
    i18n: { language: "en", exists: () => false },
  }),
}));

describe("sidebar Tower nav item", () => {
  it("labels the Feed page link Tower", () => {
    renderWithProviders(<SidebarAppsList collapsed={false} />);

    expect(screen.getByTestId("sidebar-feed-link")).toHaveTextContent("Tower");
  });
});
