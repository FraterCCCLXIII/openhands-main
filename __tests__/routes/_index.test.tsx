import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import Index, { loader } from "~/routes/_index/route";

const RemixStub = createRemixStub([
  {
    path: "/",
    Component: Index,
    loader,
  },
]);

describe("Home Page", () => {
  beforeEach(() => {
    // Mock IntersectionObserver (`framer-motion` uses it)
    const mockIntersectionObserver = vi.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });

  describe("Repo statistics", () => {
    it("should render the repo statistics", async () => {
      render(<RemixStub />);

      const statisticsContainer = await screen.findByTestId("repo-statistics");
      within(statisticsContainer).getByText("28k Stars");
      within(statisticsContainer).getByText("30 Contributors");
      within(statisticsContainer).getByText("Last Commit 2 hours ago");
    });
  });

  describe("Collaborator grid", () => {
    it("should render 12 collaborators", async () => {
      render(<RemixStub />);
      const collaboratorGrid = await screen.findByTestId("contributors");
      const contributors = within(collaboratorGrid).getAllByRole("listitem");

      expect(contributors).toHaveLength(12);
    });

    it("should render the correct collaborator images", async () => {
      render(<RemixStub />);
      const collaboratorGrid = await screen.findByTestId("contributors");
      const contributors = within(collaboratorGrid).getAllByRole("listitem");

      contributors.forEach((collaborator, index) => {
        const img = within(collaborator).getByRole("img");
        expect(img).toHaveAttribute("src", expect.stringContaining(`contributor-${index}`));
      });
    });
  });
});
