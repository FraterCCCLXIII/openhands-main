import { Link } from "@remix-run/react";
import { PlaceholderImage } from "./placeholder-image";

interface BlogCardProps {
  blogId: string;
  title: string;
  description: string;
}

export const BlogCard: React.FC<BlogCardProps> = ({ blogId, title, description }) => (
  <div className="flex flex-col gap-8 px-[42px] py-[45px]">
    <PlaceholderImage className="aspect-video rounded-[7px]" />
    <div className="flex flex-col gap-4 items-start">
      <h2 className="font-quincy text-[33px] leading-[33px]">{title}</h2>
      <p className="paragraph text-description">{description}</p>
      <Link to={blogId} className="paragraph text-description font-semibold">Read More</Link>
    </div>
  </div>
);
