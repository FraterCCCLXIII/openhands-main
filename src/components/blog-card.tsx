import { Link } from "react-router-dom";
import { PlaceholderImage } from "./placeholder-image";

interface BlogCardProps {
  blogId: string;
  title: string;
  description: string;
  img: { src?: string; alt: string };
}

export const BlogCard: React.FC<BlogCardProps> = ({ blogId, title, description, img }) => (
  <div className="flex flex-col gap-8 px-[42px] py-[45px]">
    {!img.src && <PlaceholderImage className="aspect-video rounded-[7px]" />}
    {img.src && <img src={img.src} alt={img.alt} className="bg-[#ACC8FF] flex items-center justify-center aspect-video rounded-[7px] object-contain" />}
    <div className="flex flex-col gap-4 items-start">
      <h2 className="font-quincy text-[33px] leading-[33px]">{title}</h2>
      <p className="paragraph text-description">{description}</p>
      <Link to={blogId} className="paragraph text-description font-semibold">Read More</Link>
    </div>
  </div>
);
