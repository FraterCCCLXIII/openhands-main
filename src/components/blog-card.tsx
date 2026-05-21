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
  <div
    data-testid='featured-blog-card'
    data-wf-el='blog-item'
    className='group relative w-full overflow-hidden rounded-[19.2px] bg-transparent text-brand-fg'
    style={{ height: '620px' }}
  >
    <div data-wf-el='standard-media' className='relative h-full w-full'>
      {!img && <PlaceholderImage className='h-full w-full' />}
      {img && (
        <img
          data-wf-el='standard-media-img'
          src={img}
          alt={imgAlt}
          className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]'
          style={{ color: 'rgb(34, 21, 13)' }}
        />
      )}
    </div>

    <div className='absolute inset-0 bg-black/50 backdrop-blur-[2px]' />

    <div data-wf-el='blog-item-content' className='absolute inset-0 flex flex-col items-start justify-end'>
      <div data-wf-el='card-body' className='featured-blog-card-body relative flex h-full w-full flex-col items-start justify-end' style={{ padding: '24px' }}>
        <div data-wf-el='standard-wrap' className='w-full'>
          <div className='featured-blog-copy flex w-[496px] flex-col px-5'>
            <p data-wf-el='paragraph-lg' className='m-0 font-sohne text-lg lg:text-[20.8px] leading-[24.96px] font-medium text-brand-accent' style={{ textWrap: 'pretty' }}>
              {title}
            </p>
            <p data-wf-el='paragraph-lg' className='m-0 text-lg lg:text-[20.8px] leading-[1.2] font-medium text-white' style={{ textWrap: 'pretty' }}>
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
  img?: string;
  imgAlt?: string;
  showDate?: boolean;
  titleLinkOnly?: boolean;
  webflowIndexCard?: boolean;
  verticalOffset?: number;
}

export const BlogCard: React.FC<BlogCardProps> = ({
  title,
  date,
  href,
  img,
  imgAlt,
  showDate = true,
  titleLinkOnly = false,
  webflowIndexCard = false,
  verticalOffset = 0,
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

  return (
    <Link to={href} className={`group relative block ${webflowIndexCard ? 'blog-grid-card w-full' : ''}`} data-testid='blog-card' data-wf-el={webflowIndexCard ? 'blog-item' : undefined} style={webflowIndexCard ? { maxWidth: '100%', top: verticalOffset ? `-${verticalOffset}px` : undefined } : undefined}>
      <div className='flex flex-col gap-6'>
        <div data-wf-el={webflowIndexCard ? 'standard-media' : undefined} className='blog-card-media overflow-hidden rounded-[6px]' style={webflowIndexCard ? { minHeight: '270px' } : undefined}>{image}</div>

        <div className='blog-card-copy flex max-w-[352px] flex-col gap-0'>
          {showDate && date && (
            <p data-wf-el={webflowIndexCard ? 'paragraph-sm' : undefined} className='text-[14.4px] leading-[21.6px] text-[#5f5f5f]' style={{ marginTop: '0px', marginBottom: '14.4px' }}>{formatDate(date)}</p>
          )}
          <p data-wf-el={webflowIndexCard ? 'paragraph-lg' : undefined} className='m-0 font-sohne text-[20.8px] leading-[24.96px] font-medium text-brand-fg' style={webflowIndexCard ? { textWrap: 'pretty' } : undefined}>
            {title}
          </p>
        </div>
      </div>
    </Link>
  );
};
