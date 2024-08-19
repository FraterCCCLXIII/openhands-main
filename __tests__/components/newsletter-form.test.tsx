import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NewsletterForm } from "../../src/components/newsletter-form";

describe("NewsletterForm", () => {
  it("should render a subscribe text button", () => {
    render(<NewsletterForm />);

    const text = screen.getByText("Subscribe to our newsletter");
    const form = screen.queryByRole("form");

    expect(text).toBeInTheDocument();
    expect(form).not.toBeInTheDocument();
  });

  it.todo("should render the form when the subscribe button is clicked");
  it.todo("should display an error message");
  it.todo("should display a success message");
});
