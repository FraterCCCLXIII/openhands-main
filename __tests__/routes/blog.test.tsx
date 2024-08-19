import { render, screen, within } from "@testing-library/react";
import { ActionFunctionArgs, createMemoryRouter, RouterProvider, json } from "react-router-dom";
import { describe, expect, it } from "vitest";
import Blog from "../../src/routes/blog";
import { HelmetProvider } from "react-helmet-async";
import userEvent, { type UserEvent } from "@testing-library/user-event";

const MOCK_BLOGS = [{ data: { title: "title", excerpt: "excerpt" } }];

const router = createMemoryRouter([
  {
    path: "/blog",
    element: <Blog />,
    loader: () => ({ blogs: MOCK_BLOGS }),
    action: async ({ request }: ActionFunctionArgs) => {
      const formData = await request.formData();
      const email = formData.get("email");

      if (email?.toString() === "success@s.s") {
        return json({ result: "success", msg: "You have successfully subscribed!" });
      }

      if (email?.toString() === "error@e.e") {
        return json({ result: "error", msg: "Something went wrong" });
      }

      return json(null);
    },
  },
], { initialEntries: ["/blog"] });

const openFormUtility = async (user: UserEvent) => {
  const button = await screen.findByRole("button", { name: "Subscribe to our newsletter" });
  await user.click(button);

  const form = await screen.findByTestId("newsletter-form");
  const input = within(form).getByPlaceholderText("Email");
  const submitButton = within(form).getByRole("button", { name: "Subscribe" });

  return { form, input, submitButton };
};

const renderBlog = () => render(<RouterProvider router={router} />, { wrapper: ({ children }) => <HelmetProvider>{children}</HelmetProvider> });

describe("Blog", () => {
  it("should render the blog page", async () => {
    renderBlog();
    await screen.findByText(/our blog/i);
  });

  describe("Newsletter form", () => {
    it("should render the subscribe button", async () => {
      renderBlog();
      await screen.findByRole("button", { name: "Subscribe to our newsletter" });

      const form = screen.queryByTestId("newsletter-form");
      expect(form).not.toBeInTheDocument();
    });

    it("should render the newsletter form when the subscribe button is clicked", async () => {
      const user = userEvent.setup();
      renderBlog();

      const button = await screen.findByRole("button", { name: "Subscribe to our newsletter" });
      await user.click(button);

      await screen.findByTestId("newsletter-form");
    });

    it("should display a success message when the form is submitted successfully", async () => {
      const user = userEvent.setup();
      renderBlog();

      const { input, submitButton } = await openFormUtility(user);
      await user.type(input, "success@s.s");
      await user.click(submitButton);

      await screen.findByText("You have successfully subscribed!");
    });

    // TODO: Fix the test
    it.skip("should display an error message when the form is submitted and returns an error", async () => {
      const user = userEvent.setup();
      renderBlog();

      const { input, submitButton } = await openFormUtility(user);
      await user.type(input, "error@e.e");
      await user.click(submitButton);

      await screen.findByText("Something went wrong");
    });

    // TODO: Fix the test
    it.skip("should not be able to submit the form if the email is invalid", async () => {
      const user = userEvent.setup();
      renderBlog();

      const { input, submitButton } = await openFormUtility(user);
      await user.type(input, "invalid email");
      await user.click(submitButton);

      await screen.findByText("Invalid email address");
    });

    it.todo("should render the submit button disabled when the form is submitting");
  });
});
