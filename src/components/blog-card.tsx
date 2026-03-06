import { PlaceholderImage } from "./placeholder-image";

interface FeaturedBlogCardProps {
  title: string;
  description: string;
  img?: string;
}

export const FeaturedBlogCard: React.FC<FeaturedBlogCardProps> = ({ title, description, img }) => (
  <div data-testid="blog-card" className="flex flex-col lg:flex-row py-[30px] lg:py-[45px] px-[20px] lg:px-[42px] gap-4 lg:gap-8">
    <img src={img} alt="" className="w-full lg:w-1/2 aspect-video object-cover rounded-[7px] lg:rounded-[10px]" />
    <div className="flex flex-col gap-4">
      <div className="heading font-bold">{title}</div>
      <p className="paragraph text-description">{description}</p>
      <span
        className="paragraph font-semibold text-description">
        Read More
      </span>
    </div>
  </div>
);

interface BlogCardProps {
  title: string;
  description: string;
  img?: string;
}

export const BlogCard: React.FC<BlogCardProps> = ({ title, description, img }) => (
  <div data-testid="blog-card" className="flex flex-col gap-4 lg:gap-8 px-[20px] lg:px-[42px] py-[30px] lg:py-[45px]">
    {!img && <PlaceholderImage variant="robot" className="aspect-video rounded-[7px]" />}
    {img && <img src={img} alt="" className="flex items-center justify-center aspect-video rounded-[7px] object-cover" />}
    <div className="flex flex-col gap-4 items-start">
      <div className="font-quincy font-bold text-[28px] leading-[32px] lg:text-[33px] lg:leading-[33px]">{title}</div>
      <p className="paragraph text-description">{description}</p>
      <span className="paragraph text-description font-semibold">Read More</span>
    </div>
  </div>
);
