import clsx from "clsx";
import React from "react";
import { Helmet } from "react-helmet-async";
import { useLoaderData } from "react-router-dom";
import { blogAPI } from "~/api/blog";
import { BlogCard, FeaturedBlogCard } from "~/components/blog-card";
import { Button } from "~/components/button";
import { SectionHeading } from "~/components/section-heading";
import { useWidth } from "~/hooks/use-media";
import { stringToSlug } from "~/utils/string-to-slug";

interface FormButtonProps {
  onClick?: () => void;
  type?: "button" | "submit";
  children: string;
}

const FormButton: React.FC<FormButtonProps> = ({ onClick, type = "button", children }) => (
  <button
    type={type}
    onClick={onClick}
    className={clsx(
      "bg-black text-white py-2 text-sm",
      "font-semibold px-4 rounded-lg hover:bg-[#4B5563] hover:text-white",
    )}
  >
    {children}
  </button>
);

export const loader = async () => {
  const blogs = blogAPI.getAllBlogs();
  blogs.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  return { blogs };
};

const Blog = () => {
  const [formIsVisible, setFormIsVisible] = React.useState(false);
  const { blogs } = useLoaderData() as { blogs: Post[] }
  const latestBlog = blogs[0];

  const width = useWidth();

  return (
    <main>
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
            <FormButton onClick={() => setFormIsVisible(true)}>Subscribe to our newsletter</FormButton>
          )}
          {formIsVisible && (
            <form
              className="flex gap-2"
              method="post"
              action="https://dev.us17.list-manage.com/subscribe/post"
            >
              <input
                type="email"
                placeholder="Email"
                required
                pattern="[^@]+@[^.]+\..+"
                className="bg-white text-black py-2 px-4 rounded-lg w-[300px]"
              />
              <FormButton type="submit">Subscribe</FormButton>
            </form>
          )}
        </SectionHeading>
      </section>

      <section className="hidden lg:block">
        <FeaturedBlogCard
          blogId={stringToSlug(latestBlog.data.title)}
          title={latestBlog.data.title}
          description={latestBlog.data.excerpt}
        />
      </section>

      <section className="flex flex-col items-center">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {blogs.slice(width > 1024 ? 1 : 0).map((blog, index) => (
            <BlogCard
              key={index}
              blogId={stringToSlug(blog.data.title)}
              title={blog.data.title}
              description={blog.data.excerpt}
            />
          ))}
        </div>

        <div className="py-[45px]">
          <Button text="Load More" to="/blog" />
        </div>
      </section>
    </main>
  );
};

export default Blog;
