import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { NewsletterForm } from "../../src/components/newsletter-form";
import userEvent from "@testing-library/user-event";

describe("NewsletterForm", () => {
  vi.mock("react-router-dom", () => ({
    // @ts-expect-error - children is any
    Form: ({ children, ...props }) => <form {...props}>{children}</form>,
  }));

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
});
