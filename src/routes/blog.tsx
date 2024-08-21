import React from "react";
import { Helmet } from "react-helmet-async";
import { ActionFunctionArgs, json, Link, useActionData, useLoaderData, useNavigation } from "react-router-dom";
import { blogAPI } from "~/api/blog";
import { subscribeToNewsletter } from "~/api/newsletter";
import { BlogCard, FeaturedBlogCard } from "~/components/blog-card";
import { NewsletterForm } from "~/components/newsletter-form";
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
  try {
    const data = await subscribeToNewsletter(email);
    return json(data);
  } catch (error) {
    return json({ result: "error", msg: "Failed to subscribe. Please try again later." });
  }
}

const Blog = () => {
  const navigation = useNavigation();
  const data = useActionData() as { result: "success" | "error", msg: string } | undefined | null;
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
          subheading="OUR BLOG"
        >
          <NewsletterForm
            error={data?.result === "error" ? data.msg : undefined}
            success={data?.result === "success" ? data.msg : undefined}
            disabled={navigation.state === "submitting" || !!data}
          />
        </SectionHeading>
      </section>

      <section className="max-w-[1440px] monitor:self-center">
        <section className="hidden lg:block">
          <Link to={stringToSlug(latestBlog.data.title)}>
            <FeaturedBlogCard
              title={latestBlog.data.title}
              description={latestBlog.data.excerpt}
              img={latestBlog.data.coverImage}
            />
          </Link>
        </section>

        <section className="flex flex-col items-center">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            {blogs
              .slice((width >= 1024 ? 1 : 0), visibleCount + (width >= 1024 ? 1 : 0))
              .map((blog) => (
                <Link
                  key={stringToSlug(blog.data.title)}
                  to={stringToSlug(blog.data.title)}
                >
                  <BlogCard
                    title={blog.data.title}
                    description={blog.data.excerpt}
                    img={blog.data.coverImage}
                  />
                </Link>
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
