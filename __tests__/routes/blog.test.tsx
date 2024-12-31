import { render, screen, within } from "@testing-library/react";
import { ActionFunctionArgs, createMemoryRouter, RouterProvider, json } from "react-router-dom";
import { beforeAll, describe, expect, it } from "vitest";
import Blog from "../../src/routes/blog";
import { HelmetProvider } from "react-helmet-async";
import userEvent, { type UserEvent } from "@testing-library/user-event";

const MOCK_BLOGS = [
  { data: { title: "post-0", excerpt: "post-0-excerpt", date: "2024-01-06" } },
  { data: { title: "post-1", excerpt: "post-1-excerpt", date: "2024-01-05" } },
  { data: { title: "post-3", excerpt: "post-3-excerpt", date: "2024-01-04" } },
  { data: { title: "post-2", excerpt: "post-2-excerpt", date: "2024-01-03" } },
  { data: { title: "post-4", excerpt: "post-4-excerpt", date: "2024-01-02" } },
  { data: { title: "post-5", excerpt: "post-5-excerpt", date: "2024-01-12" } }, // latest
];

const router = createMemoryRouter([
  {
    path: "/blog",
    element: <Blog />,
    loader: () => {
      MOCK_BLOGS.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
      return json({ blogs: MOCK_BLOGS });
    },
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

  describe("Posts", () => {
    beforeAll(() => {
      global.innerWidth = 1024; // set the window width to 1024px
    });

    it("should render the posts", async () => {
      renderBlog();
      const posts = await screen.findAllByTestId("blog-card");

      // initial render
      expect(posts).toHaveLength(4); // 3 initial posts + 1 featured post

      // latest post should be the first post
      expect(within(posts[0]).getByText("post-5"));
    });

    it("should render a button to load more posts", async () => {
      renderBlog();
      const button = await screen.findByRole("button", { name: /load more/i });
      expect(button).toBeInTheDocument();
    });

    it("should render more posts when the load more button is clicked", async () => {
      renderBlog();
      const button = await screen.findByRole("button", { name: /load more/i });
      await userEvent.click(button);

      const posts = await screen.findAllByTestId("blog-card");
      expect(posts).toHaveLength(6); // 4 initial posts + 2 remaining posts

      const buttonText = screen.queryByText(/load more/i);
      expect(buttonText).not.toBeInTheDocument();
    });
  });
});
