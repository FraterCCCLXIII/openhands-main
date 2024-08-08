import { json, Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/button";
import { SectionHeading } from "~/components/section-heading";
import { BlogCard } from "./blog-card";
import { PlaceholderImage } from "./placeholder-image";
import { MetaFunction } from "@remix-run/node";
import { getAllBlogs } from "~/posts";

export const meta: MetaFunction = () => ([
  { title: "All Hands Blog - Insights and Innovations" },
  { name: "description", content: "Read the latest insights and innovations from All Hands." },
]);

export const loader = async () => {
  const blogs = await getAllBlogs();
  blogs.sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());
  return json({ blogs });
};

const Blog = () => {
  const { blogs } = useLoaderData<typeof loader>();
  const latestBlog = blogs[0];

  return (
    <main>
      <section>
        <SectionHeading
          isHero
          heading="This is what we're up to"
          subheading="OUR BLOG"
          description="Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software."
          cta={{
            text: "Subscribe to our newsletter",
            href: "/blog",
          }}
        />
      </section>

      <section className="flex py-[45px] px-[42px] gap-8">
        {!latestBlog.frontmatter.coverImage && <PlaceholderImage className="w-[600px] h-[370px]" />}
        {latestBlog.frontmatter.coverImage && (
          <img
            src={latestBlog.frontmatter.coverImage}
            alt="blog cover"
            className="rounded-[10px] bg-[#ACC8FF] flex items-center justify-center w-[600px] h-[370px] object-contain"
          />
        )}
        <div className="flex flex-col gap-4">
          <h2 className="heading">{latestBlog.frontmatter.title}</h2>
          <p className="paragraph text-description w-[466px]">{latestBlog.frontmatter.excerpt}</p>
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
              title={blog.frontmatter.title}
              description={blog.frontmatter.excerpt}
              img={{
                src: blog.frontmatter.coverImage,
                alt: "blog cover",
              }}
            />
          ))}
        </div>

        <div className="py-[45px]">
          <Button text="Load More" />
        </div>
      </section>
    </main>
  );
};

export default Blog;
