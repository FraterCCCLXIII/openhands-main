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
          style={{ color: 'rgb(34, 21, 13)' }}
        />
      )}
    </div>

    <div className='absolute inset-0 bg-gradient-to-t from-[#22150d] via-[#22150d]/58 to-transparent' />

    <div className='absolute inset-x-0 bottom-0 p-6 lg:p-6'>
      <div className='max-w-[456px]'>
        <p className='m-0 font-sohne text-lg lg:text-[20.8px] leading-[24.96px] font-medium text-brand-accent'>
          {title}
        </p>
        <p className='m-0 text-lg lg:text-[20.8px] leading-[1.2] font-medium text-white'>
          {description}
        </p>
        {/* Live's Read-more is a Webflow overlay-link hybrid: the
         * `<a>` is `position:absolute; inset:0; padding:0; display:
         * block` AND carries the visible text styles (fontWeight 500,
         * underline 1.6px, lineHeight 20.8, textAlign center). The
         * visible size comes from the wrapper's padding. */}
        <div
          className='relative inline-flex btn text-[16px] leading-[20.8px] text-brand-bg pointer-events-none'
          style={{ gap: '6.4px', padding: '14.4px 30.4px', borderRadius: '8px', marginBottom: '10px', backgroundColor: 'rgb(34, 21, 13)' }}
          aria-hidden='true'
        >
          <span style={{ visibility: 'hidden' }}>Read more</span>
          <Link
            to={href}
            className='absolute inset-0 block btn text-[16px] leading-[20.8px] text-brand-bg pointer-events-auto'
            style={{ padding: '0px' }}
          >
            Read more
          </Link>
        </div>
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
  const imageClassName = titleLinkOnly ? 'h-[250px] w-full' : 'aspect-[10/7] w-full';
  const image = !img ? (
    <PlaceholderImage variant='robot' className={imageClassName} />
  ) : (
    <img
      src={img}
      alt={imgAlt !== undefined ? imgAlt : `${title} cover image`}
      className={`${imageClassName} transition-transform duration-300 group-hover:scale-[1.02]`}
      style={{ objectFit: 'fill' }}
    />
  );

  if (titleLinkOnly) {
    return (
      <Link
        to={href}
        className='group block'
        data-testid='blog-card'
        style={{ fontFamily: 'Sohne Buch, Sohne Kraftig, Inter, Arial, sans-serif' }}
      >
        <article className='flex flex-col gap-0'>
          <div className='overflow-hidden rounded-[6px]'>{image}</div>

          <div className='flex max-w-[354px] flex-col gap-0'>
            {showDate && date && (
              <p className='text-[14.4px] leading-[21.6px] text-[#5f5f5f]' style={{ marginTop: '31.2px', marginBottom: '14.4px' }}>{formatDate(date)}</p>
            )}
            <p className='m-0 font-sohne text-[20.8px] leading-[24.96px] font-medium text-brand-fg' style={{ marginTop: showDate && date ? '0px' : '31.2px' }}>
              <span className='transition-colors group-hover:text-brand-brown'>
                {title}
              </span>
            </p>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={href} className='group relative block' data-testid='blog-card'>
      <article className='flex flex-col gap-6'>
        <div className='overflow-hidden rounded-[6px]'>{image}</div>

        <div className='flex max-w-[352px] flex-col gap-0'>
          {showDate && date && (
            <p className='text-[14.4px] leading-[21.6px] text-[#5f5f5f]' style={{ marginTop: '0px', marginBottom: '14.4px' }}>{formatDate(date)}</p>
          )}
          <p className='m-0 font-sohne text-[20.8px] leading-[24.96px] font-medium text-brand-fg'>
            {title}
          </p>
        </div>
      </article>
    </Link>
  );
};
