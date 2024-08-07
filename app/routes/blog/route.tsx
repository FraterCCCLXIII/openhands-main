import { Link } from "@remix-run/react";
import { Button } from "~/components/button";
import { SectionHeading } from "~/components/section-heading";
import { BlogCard } from "./blog-card";

const Blog = () => {
  return (
    <main>
      <section>
        <SectionHeading
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
        <img src="" alt="" className="w-[600px] h-[370px] rounded-[10px] bg-[#ACC8FF]" />
        <div className="flex flex-col gap-4">
          <h2 className="heading">Lorem Ipsum</h2>
          <p className="paragraph text-[#292A36] w-[466px]">Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software.</p>
          <Link to="lorem-ipsum" className="paragraph font-semibold text-[#292A36]">Read More</Link>
        </div>
      </section>

      <section className="flex flex-col items-center">
        <div className="flex">
          {Array.from({ length: 3 }).map((_, index) => (
            <BlogCard
              key={index}
              blogId={`lorem-ipsum-${index}`}
              title="Lorem Ipsum"
              description="Made with the collaborative help of over 40 engineers in the opensource community. OpenDev changes the way you can create software."
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
