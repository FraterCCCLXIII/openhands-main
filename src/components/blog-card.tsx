import { Link } from 'react-router';
import { formatDate } from '~/utils/format-date';
import { PlaceholderImage } from './placeholder-image';

interface FeaturedBlogCardProps {
  title: string;
  description: string;
  href: string;
  img?: string;
}

export const FeaturedBlogCard: React.FC<FeaturedBlogCardProps> = ({
  title,
  description,
  href,
  img,
}) => (
  <article
    data-testid='featured-blog-card'
    className='group relative overflow-hidden rounded-[16px] bg-card-bg text-brand-bg'
  >
    <div className='aspect-[16/10] w-full lg:aspect-[21/9]'>
      {!img && <PlaceholderImage className='h-full w-full' />}
      {img && (
        <img
          src={img}
          alt={`${title} cover image`}
          className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]'
        />
      )}
    </div>

    <div className='absolute inset-0 bg-gradient-to-t from-[#22150d] via-[#22150d]/78 to-transparent' />

    <div className='absolute inset-x-0 bottom-0 p-6 lg:p-10'>
      <div className='max-w-[560px] space-y-3 lg:space-y-4'>
        <p className='m-0 font-inter text-[24px] leading-[1.1] font-medium tracking-[-0.03em] text-brand-accent lg:text-[44px]'>
          {title}
        </p>
        <p className='m-0 text-[18px] leading-[1.2] font-medium text-brand-bg lg:text-[20px]'>
          {description}
        </p>
        <Link
          to={href}
          className='inline-flex items-center text-[18px] leading-[1.2] font-medium text-brand-bg transition-colors hover:text-brand-accent'
        >
          Read more
        </Link>
      </div>
    </div>
  </article>
);

interface BlogCardProps {
  title: string;
  date: string;
  href: string;
  img?: string;
  titleLinkOnly?: boolean;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  title,
  date,
  href,
  img,
  titleLinkOnly = false,
}) => {
  const image = !img ? (
    <PlaceholderImage variant='robot' className='aspect-[3/2] w-full' />
  ) : (
    <img
      src={img}
      alt={`${title} cover image`}
      className='aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]'
    />
  );

  if (titleLinkOnly) {
    return (
      <article data-testid='blog-card' className='flex flex-col gap-4'>
        <Link to={href} className='group block'>
          <div className='overflow-hidden rounded-[6px]'>{image}</div>
        </Link>

        <div className='max-w-[32rem] space-y-2'>
          <p className='m-0 text-[14px] leading-[1.5] text-[#5f5f5f]'>{formatDate(date)}</p>
          <p className='m-0 font-inter text-[18px] leading-[1.2] font-medium tracking-[-0.01em] text-brand-fg lg:text-[20px]'>
            <Link
              to={href}
              className='text-[16px] leading-[1.4] transition-colors hover:text-brand-brown'
            >
              {title}
            </Link>
          </p>
        </div>
      </article>
    );
  }

  return (
    <Link to={href} className='group block' data-testid='blog-card'>
      <article className='flex flex-col gap-4'>
        <div className='overflow-hidden rounded-[6px]'>{image}</div>

        <div className='max-w-[32rem] space-y-2'>
          <p className='m-0 text-[14px] leading-[1.5] text-[#5f5f5f]'>{formatDate(date)}</p>
          <p className='m-0 font-inter text-[18px] leading-[1.2] font-medium tracking-[-0.01em] text-brand-fg lg:text-[20px]'>
            {title}
          </p>
        </div>
      </article>
    </Link>
  );
};
