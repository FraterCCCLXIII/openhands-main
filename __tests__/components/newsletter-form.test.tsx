import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NewsletterForm } from "../../src/components/newsletter-form";
import userEvent from "@testing-library/user-event";

describe("NewsletterForm", () => {
  vi.mock("react-router-dom", () => ({
    // @ts-expect-error - children is any
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
  }));

  it("should render a subscribe text button", () => {
    render(<NewsletterForm />);

    const button = screen.getByRole("button", { name: "Subscribe to our newsletter" });
    const form = screen.queryByTestId("newsletter-form");

    expect(button).toBeInTheDocument();
    expect(form).not.toBeInTheDocument();
  });

  it("should render the form when the subscribe button is clicked", async () => {
    const user = userEvent.setup();
    render(<NewsletterForm />);

    const button = screen.getByRole("button", { name: "Subscribe to our newsletter" });
    await user.click(button);

    const form = screen.getByTestId("newsletter-form");
    const input = within(form).getByPlaceholderText("Email");

    expect(form).toBeInTheDocument();
    expect(input).toBeInTheDocument();

    const buttonAfterClick = screen.queryByRole("button", { name: "Subscribe to our newsletter" });
    expect(buttonAfterClick).not.toBeInTheDocument();
  });

  it("should display an error message", () => {
    render(<NewsletterForm error="Sample error message" />);

    const error = screen.getByText("Sample error message");
    expect(error).toBeInTheDocument();
  });

  it("should display a success message", () => {
    render(<NewsletterForm success="You have successfully subscribed!" />);

    const success = screen.getByText("You have successfully subscribed!");
    expect(success).toBeInTheDocument();
  });

  it("should render the submit button disabled", async () => {
    const user = userEvent.setup();
    render(<NewsletterForm disabled />);

    const button = screen.getByRole("button", { name: "Subscribe to our newsletter" });
    await user.click(button);

    const form = screen.getByTestId("newsletter-form");
    const submitButton = within(form).getByRole("button", { name: "Subscribe" });

    expect(submitButton).toBeDisabled();
  });
});
