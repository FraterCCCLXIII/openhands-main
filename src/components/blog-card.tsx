import { Link } from 'react-router';
import { OverlayLinkButton } from '~/components/overlay-link-button';
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
    className='group relative overflow-hidden rounded-[19.2px] bg-transparent text-brand-bg'
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

    <div className='absolute inset-0 bg-[#716f66]/95' />

    <div className='absolute inset-x-0 bottom-0' style={{ padding: '44px 44px 24px' }}>
      <div className='max-w-[456px]'>
        <p className='m-0 font-sohne text-lg lg:text-[20.8px] leading-[24.96px] font-medium text-brand-accent'>
          {title}
        </p>
        <p className='m-0 text-lg lg:text-[20.8px] leading-[1.2] font-medium text-white'>
          {description}
        </p>
        <OverlayLinkButton
          href={href}
          label='Read more'
          variant='primary'
          className='mt-[24px]'
        />
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
