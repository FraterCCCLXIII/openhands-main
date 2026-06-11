import { Link } from 'react-router';
import { OverlayLinkButton } from '~/components/overlay-link-button';
import { formatDate } from '~/utils/format-date';
import { PlaceholderImage } from './placeholder-image';

const BLOG_EXCERPT_CLASS =
  'blog-card-excerpt m-0 text-base leading-[1.45] text-brand-muted line-clamp-2 [text-wrap:pretty]';

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
}) => (
  <div
    data-testid='featured-blog-card'
    data-wf-el='blog-item'
    className='featured-blog-card--typography group w-full text-brand-fg'
  >
    <div data-wf-el='blog-item-content' className='py-8 md:py-10'>
      <div data-wf-el='card-body' className='featured-blog-card-body w-full' style={{ padding: '0px' }}>
        <div data-wf-el='standard-wrap' className='w-full'>
          <div className='featured-blog-copy flex w-full max-w-[720px] flex-col'>
            <p
              data-wf-el='paragraph-lg'
              className='m-0 font-sohne text-lg font-medium leading-[1.2] text-brand-fg lg:text-[32px] lg:leading-[1.15] lg:tracking-[-0.02em]'
              style={{ textWrap: 'pretty', marginBottom: '16px' }}
            >
              {title}
            </p>
            <p data-wf-el='paragraph-lg' className={BLOG_EXCERPT_CLASS}>
              {description}
            </p>
            <div data-wf-el='standard-wrap' style={{ marginTop: '24px' }}>
              <OverlayLinkButton
                href={href}
                label='Read more'
                variant='primary'
                wfEl='button'
                textWfEl='btn-text'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

interface BlogCardProps {
  title: string;
  date?: string;
  href: string;
  excerpt?: string;
  img?: string;
  imgAlt?: string;
  showDate?: boolean;
  titleLinkOnly?: boolean;
  webflowIndexCard?: boolean;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  title,
  date,
  href,
  excerpt,
  img,
  imgAlt,
  showDate = true,
  titleLinkOnly = false,
  webflowIndexCard = false,
}) => {
  const imageClassName = titleLinkOnly ? 'h-[250px] w-full' : webflowIndexCard ? 'h-[270px] w-full' : 'aspect-[10/7] w-full';
  const image = !img ? (
    <PlaceholderImage variant='robot' className={imageClassName} />
  ) : (
    <img
      data-wf-el={webflowIndexCard ? 'standard-media-img' : undefined}
      src={img}
      alt={imgAlt !== undefined ? imgAlt : `${title} cover image`}
      className={`${imageClassName} transition-transform duration-300 group-hover:scale-[1.02]`}
      style={webflowIndexCard ? { objectFit: 'fill', aspectRatio: '3 / 2' } : { objectFit: 'fill' }}
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
        <div className='flex flex-col gap-0'>
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
        </div>
      </Link>
    );
  }

  if (webflowIndexCard) {
    return (
      <Link
        to={href}
        className={`group blog-grid-card blog-card--typography relative block w-full`}
        data-testid='blog-card'
        data-wf-el='blog-item'
        style={{ maxWidth: '100%' }}
      >
        <div className='blog-card-copy flex w-full flex-col gap-0'>
          {showDate && date && (
            <p
              data-wf-el='paragraph-sm'
              className='font-mono text-[14.4px] leading-[21.6px] text-brand-muted'
              style={{ marginTop: '0px', marginBottom: '14.4px' }}
            >
              {formatDate(date)}
            </p>
          )}
          <p
            data-wf-el='paragraph-lg'
            className='m-0 font-sohne text-[20.8px] font-medium leading-[24.96px] text-brand-fg transition-colors group-hover:text-[#8a5f45]'
            style={{ textWrap: 'pretty' }}
          >
            {title}
          </p>
          {excerpt ? (
            <p data-wf-el='paragraph-sm' className={`${BLOG_EXCERPT_CLASS} mt-3`}>
              {excerpt}
            </p>
          ) : null}
        </div>
      </Link>
    );
  }

  return (
    <Link to={href} className='group relative block' data-testid='blog-card'>
      <div className='flex flex-col gap-6'>
        <div className='blog-card-media overflow-hidden rounded-[6px]'>{image}</div>

        <div className='blog-card-copy flex w-full flex-col gap-0'>
          {showDate && date && (
            <p className='text-[14.4px] leading-[21.6px] text-[#5f5f5f]' style={{ marginTop: '0px', marginBottom: '14.4px' }}>{formatDate(date)}</p>
          )}
          <p className='m-0 font-sohne text-[20.8px] leading-[24.96px] font-medium text-brand-fg'>
            {title}
          </p>
        </div>
      </div>
    </Link>
  );
};
