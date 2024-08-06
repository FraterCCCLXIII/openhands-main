import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import Index, { loader } from "~/routes/_index/route";

const RemixStub = createRemixStub([
  {
    path: "/",
    Component: Index,
    loader,
  }
]);

describe("Home Page", () => {
  describe("Repo statistics", () => {
    it("should render the repo statistics", async () => {
      render(<RemixStub />);

      const statisticsContainer = await screen.findByTestId("repo-statistics");
      within(statisticsContainer).getByText("28k Stars");
      within(statisticsContainer).getByText("50 Contributors");
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
