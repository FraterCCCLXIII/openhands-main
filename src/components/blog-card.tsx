import { Link } from "react-router-dom";
import { PlaceholderImage } from "./placeholder-image";

interface FeaturedBlogCardProps {
  title: string;
  description: string;
  blogId: string;
  img?: string;
}

export const FeaturedBlogCard: React.FC<FeaturedBlogCardProps> = ({ blogId, title, description, img }) => (
  <Link to={blogId} className="flex py-[45px] px-[42px] gap-8">
    <img src={img} alt="" className="max-w-[600px] aspect-video object-cover rounded-[10px]" />
    <div className="flex flex-col gap-4">
      <h2 className="heading">{title}</h2>
      <p className="paragraph text-description w-[466px]">{description}</p>
      <span
        className="paragraph font-semibold text-description">
        Read More
      </span>
    </div>
  </Link>
);

interface BlogCardProps {
  blogId: string;
  title: string;
  description: string;
  img?: string;
}

export const BlogCard: React.FC<BlogCardProps> = ({ blogId, title, description, img }) => (
  <Link to={blogId} className="flex flex-col gap-8 px-[42px] py-[45px]">
    {!img && <PlaceholderImage variant="robot" className="aspect-video rounded-[7px]" />}
    {img && <img src={img} alt="" className="flex items-center justify-center aspect-video rounded-[7px] object-cover" />}
    <div className="flex flex-col gap-4 items-start">
      <h2 className="font-quincy text-[33px] leading-[33px]">{title}</h2>
      <p className="paragraph text-description">{description}</p>
      <span className="paragraph text-description font-semibold">Read More</span>
    </div>
  </Link>
);
