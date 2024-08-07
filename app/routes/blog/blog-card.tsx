import { Link } from "@remix-run/react";

interface BlogCardProps {
  blogId: string;
  title: string;
  description: string;
}

export const BlogCard: React.FC<BlogCardProps> = ({ blogId, title, description }) => (
  <div className="flex flex-col gap-8 px-[42px] py-[45px]">
    <img src="" alt="" className="aspect-video bg-[#ACC8FF] rounded-[7px]" />
    <div className="flex flex-col gap-4 items-start">
      <h2 className="font-quincy text-[33px] leading-[33px]">{title}</h2>
      <p className="paragraph text-[#292A36]">{description}</p>
      <Link to={blogId} className="paragraph text-[#292A36] font-semibold">Read More</Link>
    </div>
  </div>
);
