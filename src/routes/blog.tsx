import { Helmet } from "react-helmet-async";
import { Link, useLoaderData } from "react-router-dom";
import { blogAPI } from "~/api/blog";
import { BlogCard } from "~/components/blog-card";
import { Button } from "~/components/button";
import { PlaceholderImage } from "~/components/placeholder-image";
import { SectionHeading } from "~/components/section-heading";

export const loader = async () => {
  const blogs = blogAPI.getAllBlogs();
  blogs.sort((a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime());
  return { blogs };
};

const Blog = () => {
  const { blogs } = useLoaderData() as { blogs: Post[] }
  const latestBlog = blogs[0];

  return (
    <main>
      <Helmet>
        <title>All Hands AI Blog - Insights and Innovations</title>
        <meta
          name="description"
          content="Read the latest insights and innovations from All Hands AI."
        />
      </Helmet>

      <section>
        <SectionHeading
          isHero
          heading="This is what we're up to"
          subheading="OUR BLOG"
          description="Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software."
          cta={{
            text: "Subscribe to our newsletter",
            to: "/blog",
          }}
        />
      </section>

      <section className="flex py-[45px] px-[42px] gap-8">
        {!latestBlog.data.coverImage && <PlaceholderImage className="w-[600px] h-[370px]" />}
        {latestBlog.data.coverImage && (
          <img
            src={latestBlog.data.coverImage}
            alt="blog cover"
            className="rounded-[10px] flex items-center justify-center w-[600px] h-[370px] object-contain"
          />
        )}
        <div className="flex flex-col gap-4">
          <h2 className="heading">{latestBlog.data.title}</h2>
          <p className="paragraph text-description w-[466px]">{latestBlog.data.excerpt}</p>
          <Link
            to={blogs.findIndex((blog) => blog === latestBlog).toString()}
            className="paragraph font-semibold text-description">
            Read More
          </Link>
        </div>
      </section>

      <section className="flex flex-col items-center">
        <div className="grid grid-cols-3">
          {blogs.map((blog, index) => (
            <BlogCard
              key={index}
              blogId={index.toString()}
              title={blog.data.title}
              description={blog.data.excerpt}
              img={{
                src: blog.data.coverImage,
                alt: "blog cover",
              }}
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
