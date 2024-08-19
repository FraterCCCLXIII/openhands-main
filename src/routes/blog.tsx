import clsx from "clsx";
import fetchJsonp from "fetch-jsonp";
import React from "react";
import { Helmet } from "react-helmet-async";
import { ActionFunctionArgs, Form, json, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import { blogAPI } from "~/api/blog";
import { BlogCard, FeaturedBlogCard } from "~/components/blog-card";
import { RegularButton } from "~/components/regular-button";
import { SectionHeading } from "~/components/section-heading";
import { useWidth } from "~/hooks/use-media";
import { stringToSlug } from "~/utils/string-to-slug";

export const loader = async () => {
  const blogs = blogAPI.getAllBlogs();
  blogs.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  return { blogs };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");

  if (!email || typeof email !== "string") {
    return json({ result: "error", msg: "Email is required" });
  }

  const url = "https://dev.us17.list-manage.com/subscribe/post?u=669d348a75588dd92a51fb0a4&id=34795608c8";
  const query = new URLSearchParams({ EMAIL: email }).toString();
  const endpoint = url.replace("/post", "/post-json") + `&${query}`;

  try {
    // This is a JSONP request to Mailchimp's API
    // (Mailchimp doesn't support CORS, so we have to use JSONP)
    const response = await fetchJsonp(endpoint, {
      jsonpCallback: "c",
    });

    const data = await response.json() as { result: string, msg: string };
    return json(data);
  } catch (error) {
    return json({ result: "error", msg: "Failed to subscribe. Please try again later." });
  }
}

const Blog = () => {
  const data = useActionData() as { result: "success" | "error", msg: string } | undefined | null;
  const navigation = useNavigation();
  const [formIsVisible, setFormIsVisible] = React.useState(false);
  const { blogs } = useLoaderData() as { blogs: Post[] }
  const latestBlog = blogs[0];

  const width = useWidth();

  const [visibleCount, setVisibleCount] = React.useState(3);

  const loadMoreBlogs = () => {
    setVisibleCount((prev) => prev + 3);
  }

  return (
    <main className="flex flex-col">
      <Helmet>
        <title>All Hands AI Blog - Insights and Innovations</title>
        <meta
          name="description"
          content="Read the latest insights and innovations from All Hands AI."
        />
      </Helmet>

      <section className="flex flex-col items-center">
        <SectionHeading
          isHero
          heading="This is what we're up to"
          subheading="OUR BLOG"
          description="Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software."
        >
          {!formIsVisible && (
            <RegularButton onClick={() => setFormIsVisible(true)}>Subscribe to our newsletter</RegularButton>
          )}
          {formIsVisible && !data && (
            <Form
              data-testid="newsletter-form"
              className="flex gap-2"
              method="post"
            >
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                pattern="[^@]+@[^.]+\..+"
                className="bg-white text-black py-2 px-4 rounded-lg w-[300px]"
              />
              <RegularButton
                type="submit"
                disabled={navigation.state === "submitting" || !!data}
              >
                Subscribe
              </RegularButton>
            </Form>
          )}
          {data && (
            <p
              className={clsx(
                "description h-[25px]",
                data.result === "success" ? "text-green-600" : "text-red-600",
              )}
            >
              {data.msg}
            </p>
          )}
        </SectionHeading>
      </section>

      <section className="max-w-[1440px] monitor:self-center">
        <section className="hidden lg:block">
          <FeaturedBlogCard
            blogId={stringToSlug(latestBlog.data.title)}
            title={latestBlog.data.title}
            description={latestBlog.data.excerpt}
            img={latestBlog.data.coverImage}
          />
        </section>

        <section className="flex flex-col items-center">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {blogs.slice((width > 1024 ? 1 : 0), visibleCount + (width > 1024 ? 1 : 0)).map((blog, index) => (
              <BlogCard
                key={index}
                blogId={stringToSlug(blog.data.title)}
                title={blog.data.title}
                description={blog.data.excerpt}
                img={blog.data.coverImage}
              />
            ))}
          </div>

          {visibleCount < blogs.length && (
            <div className="py-[45px]">
              <RegularButton onClick={loadMoreBlogs}>Load More</RegularButton>
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default Blog;
