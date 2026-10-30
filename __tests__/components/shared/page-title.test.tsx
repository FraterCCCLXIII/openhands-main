import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageTitle } from "#/components/shared/page-title";

/* eslint-disable i18next/no-literal-string */
describe("PageTitle", () => {
  it("renders the title as the page h1 with subtitle and actions", () => {
    render(
      <PageTitle
        title="Apps"
        subtitle="Apps are built with the Canvas Extensions API"
        actions={<button type="button">Add app</button>}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Apps" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Apps are built with the Canvas Extensions API"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add app" })).toBeInTheDocument();
  });

  it("omits subtitle and actions when not provided", () => {
    render(<PageTitle title="Agents" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Agents",
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
