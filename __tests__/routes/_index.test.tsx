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

describe("Collaborator grid", () => {
  it("should render 12 collaborators", async () => {
    render(<RemixStub />);
    const collaboratorGrid = await screen.findByTestId("collaborators");
    const collaborators = within(collaboratorGrid).getAllByRole("listitem");

    expect(collaborators).toHaveLength(12);
  });

  it("should render the correct collaborator images", async () => {
    render(<RemixStub />);
    const collaboratorGrid = await screen.findByTestId("collaborators");
    const collaborators = within(collaboratorGrid).getAllByRole("listitem");

    collaborators.forEach((collaborator, index) => {
      const img = within(collaborator).getByRole("img");
      expect(img).toHaveAttribute("src", expect.stringContaining(`collaborator-${index}`));
    });
  });
});
