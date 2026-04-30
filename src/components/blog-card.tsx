import { Link } from 'react-router';
import { formatDate } from '~/utils/format-date';
import { PlaceholderImage } from './placeholder-image';

interface FeaturedBlogCardProps {
  title: string;
  description: string;
  href: string;
  img?: string;
  imgAlt?: string;
}

export const FeaturedBlogCard: React.FC<FeaturedBlogCardProps> = ({
  title,
  description,
  href,
  img,
  imgAlt = '',
}) => (
  <article
    data-testid='featured-blog-card'
    className='group relative overflow-hidden rounded-[16px] bg-card-bg text-brand-bg'
  >
    <div className='aspect-[2/1] w-full'>
      {!img && <PlaceholderImage className='h-full w-full' />}
      {img && (
        <img
          src={img}
          alt={imgAlt}
          className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]'
        />
      )}
    </div>

    <div className='absolute inset-0 bg-gradient-to-t from-[#22150d] via-[#22150d]/58 to-transparent' />

    <div className='absolute inset-x-0 bottom-0 p-6 lg:p-6'>
      <div className='max-w-[456px] space-y-3'>
        <p className='m-0 font-inter text-[24px] leading-[1.08] font-medium tracking-[-0.03em] text-brand-accent lg:text-[32px]'>
          {title}
        </p>
        <p className='m-0 text-[16px] leading-[1.25] font-medium text-brand-bg lg:text-[18px]'>
          {description}
        </p>
        <Link
          to={href}
          className='inline-flex text-[16px] leading-[20.8px] font-medium text-brand-bg'
        >
          <span className='inline-flex items-center justify-center rounded-[6px] border border-[#342117] bg-[#22150d] px-6 py-3 text-[15px] leading-none transition-colors hover:bg-[#342117]'>
            Read more
          </span>
        </Link>
      </div>
    </div>
  </article>
);

interface BlogCardProps {
  title: string;
  date?: string;
  href: string;
  img?: string;
  imgAlt?: string;
  showDate?: boolean;
  titleLinkOnly?: boolean;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  title,
  date,
  href,
  img,
  imgAlt,
  showDate = true,
  titleLinkOnly = false,
}) => {
  const image = !img ? (
    <PlaceholderImage variant='robot' className='aspect-[3/2] w-full' />
  ) : (
    <img
      src={img}
      alt={imgAlt !== undefined ? imgAlt : `${title} cover image`}
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
          {showDate && date && (
            <p className='m-0 text-[14px] leading-[1.5] text-[#5f5f5f]'>{formatDate(date)}</p>
          )}
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
          {showDate && date && (
            <p className='m-0 text-[14px] leading-[1.5] text-[#5f5f5f]'>{formatDate(date)}</p>
          )}
          <p className='m-0 font-inter text-[18px] leading-[1.2] font-medium tracking-[-0.01em] text-brand-fg lg:text-[20px]'>
            {title}
          </p>
        </div>
      </article>
    </Link>
  );
};
