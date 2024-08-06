import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import Index from "~/routes/_index/route";
import { json } from "@remix-run/react";

test("should pass", async () => {
  const RemixStub = createRemixStub([
    {
      path: "/",
      Component: Index,
      loader: async () => {
        await fetch("https://api.github.com/repos/{owner}/{repo}/collaborators");
        return json(null);
      },
    }
  ]);
  render(<RemixStub />);

  const heading = await screen.findByText("Open Source Agents for Developers");
  expect(heading).toBeInTheDocument();
});
