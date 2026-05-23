import React from 'react';
import {
  Link,
  redirect,
  type LoaderFunctionArgs,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from 'react-router';
import { blogAPI, getBlogSlug } from '~/api/blog';
import { BlogFooter } from '~/components/blog-footer';
import { CMarkdown } from '~/components/c-markdown';
import { Footer } from '~/components/footer';
import { getRouteFooterProps } from '~/constants/route-layout';
import { PlaceholderImage } from '~/components/placeholder-image';
import { getOpenHandsBlogUrl } from '~/utils/blog-slug-aliases';
import { formatDate } from '~/utils/format-date';
import { handleNewsletterSubscription } from '~/utils/newsletter-subscription';
import type { Route } from './+types/blog.$slug';
import 'katex/dist/katex.min.css';

const formatSeoTitleDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });

export const handle = { hideGlobalFooter: true };


export const action = handleNewsletterSubscription;

export const loader = ({ params, request }: LoaderFunctionArgs) => {
  if (!params.slug) {
    throw new Response('Blog not found', { status: 404 });
  }

  const slug = params.slug.toString();
  const blog = blogAPI.getBlogBySlug(slug);

  if (!blog) {
    throw redirect(getOpenHandsBlogUrl(slug));
  }

  const { content, data } = blog;

  const url = new URL(request.url).origin + '/blog/' + slug;
  const origin = new URL(request.url).origin;

  return {
    content,
    title: data.title,
    date: data.date,
    cover: data.coverImage || null,
    coverAlt: data.coverAlt ?? '',
    coverRadius: data.coverRadius || null,
    authors: data.authors.map((author) => ({
      name: author.name,
      picture: author.picture || null,
      link: author.link || null,
    })),
    excerpt: data.excerpt,
    ogImage: data.ogImage.url.startsWith('http') ? data.ogImage.url : origin + data.ogImage.url,
    articleHighlights: blogAPI.getArticleHighlightBlogs().map((highlight) => ({
      title: highlight.data.title,
      cover: highlight.data.coverImage || null,
      coverAlt: highlight.data.coverAlt ?? '',
      href: `/blog/${getBlogSlug(highlight)}`,
    })),
    seoTitleDate: data.seoTitleDate || formatSeoTitleDate(data.date),
    url,
  };
};

export const ErrorBoundary = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className='flex flex-col items-center gap-4 py-[45px] text-center'>
        <h1 className='fluid-h1 font-sohne'>
          404
        </h1>
        <p className='text-[18px] leading-[1.5] text-[#5f5f5f]'>Blog post not found.</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-4 py-[45px] text-center'>
      <h1 className='fluid-h1 font-sohne'>
        Error
      </h1>
      <p className='text-[18px] leading-[1.5] text-[#5f5f5f]'>
        There was an error loading the blog.
      </p>
    </div>
  );
};

export const meta: Route.MetaFunction = ({ data }) => {
  if (!data) {
    return [
      { title: 'OpenHands Blog' },
      { name: 'description', content: 'Read the latest from the OpenHands team.' },
    ];
  }
  return [
    { title: `${data.title} | ${data.seoTitleDate}` },
    { name: 'description', content: data.excerpt },
    { property: 'og:title', content: data.title },
    { property: 'og:description', content: data.excerpt },
    { property: 'og:image', content: data.ogImage },
    { property: 'og:url', content: data.url },
    { property: 'og:type', content: 'article' },
    { property: 'og:site_name', content: 'OpenHands' },
    { property: 'article:published_time', content: data.date },
    {
      property: 'article:author',
      content: data.authors.map((author) => author.name).join(', '),
    },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: data.title },
    { name: 'twitter:description', content: data.excerpt },
    { name: 'twitter:image', content: data.ogImage },
    { tagName: 'link', rel: 'canonical', href: data.url },
    {
      'script:ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: data.title,
        description: data.excerpt,
        image: data.cover,
        datePublished: data.date,
        author: data.authors.map((author) => ({
          '@type': 'Person',
          name: author.name,
          image: author.picture || undefined,
          url: author.link || undefined,
        })),
        publisher: {
          '@type': 'Organization',
          name: 'OpenHands',
        },
        articleBody: data.content,
        wordCount: data.content.split(' ').length,
        inLanguage: 'en-US',
      }),
    },
  ];
};

const BlogDetails = () => {
  const data = useLoaderData() as ReturnType<typeof loader>;
  const [codeElementWidth, setCodeElementWidth] = React.useState(800);

  React.useEffect(() => {
    const updateWidth = () => {
      const baseWidth = window.innerWidth;
      const padding = baseWidth >= 1024 ? 84 : 40;
      setCodeElementWidth(Math.min(baseWidth - padding, 800));
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return (
    <main data-wf-el='page-main' className='flex flex-col'>
      <section data-wf-el='section-hero' className='w-full'>
        <div className='mx-auto w-full max-w-[1238px] px-5 lg:px-0' style={{ paddingTop: '64px' }}>
          <Link
            to='/blog'
            className='mb-4 block w-fit text-[16px] leading-[1.4] font-normal text-brand-fg transition-colors hover:text-brand-brown'
          >
            ← Back to Blog
          </Link>
        </div>

        <header className='mx-auto mt-6 flex w-full max-w-[1238px] flex-col gap-8 px-5 pb-20 lg:px-0'>
          <div className='max-w-[560px]'>
            <h1 className='fluid-h1 font-sohne text-brand-fg'>
              {data.title}
            </h1>
          </div>

          <figure className={`w-full overflow-hidden ${data.coverRadius === 'none' ? 'rounded-none' : 'rounded-[8px]'}`}>
            {!data.cover && (
              <PlaceholderImage className='w-full rounded-none' />
            )}
            {data.cover && (
              <img
                src={data.cover}
                alt={data.coverAlt}
                loading='lazy'
                decoding='async'
                className='h-auto w-full rounded-none object-cover'
              />
            )}
          </figure>

          <div className='grid grid-cols-1 gap-10 pt-4 md:grid-cols-2'>
            <div>
              <p className='text-[14px] leading-[1.5] text-[#5f5f5f]' style={{ marginTop: '7.2px', marginBottom: '14.4px' }}>Written by</p>
              <p className='m-0 text-[20.8px] leading-[24.96px] font-medium text-brand-fg'>
                {data.authors.map((author, index) => {
                  const content = author.link ? (
                    <a
                      href={author.link}
                      className='text-brand-fg transition-colors hover:text-brand-brown'
                      target='_blank'
                      rel='noreferrer'
                    >
                      {author.name}
                    </a>
                  ) : (
                    <span>{author.name}</span>
                  );

                  return (
                    <React.Fragment key={author.name}>
                      {index > 0 && ', '}
                      {content}
                    </React.Fragment>
                  );
                })}
              </p>
            </div>

            <div className='md:text-right'>
              <p className='text-[14px] leading-[1.5] text-[#5f5f5f]' style={{ marginTop: '7.2px', marginBottom: '14.4px' }}>Published on</p>
              <p className='m-0 text-[20.8px] leading-[24.96px] font-medium text-brand-fg'>
                <time dateTime={data.date}>{formatDate(data.date)}</time>
              </p>
            </div>
          </div>
        </header>
      </section>

      <section data-wf-el='section' className='w-full' style={{ paddingTop: '80px', paddingBottom: '80px' }}>
        <div className='mx-auto w-full max-w-[820px] px-5 lg:px-0'>
          <CMarkdown variant='blog' codeElementWidth={codeElementWidth}>
            {data.content}
          </CMarkdown>
        </div>
      </section>

      <BlogFooter
        title={data.title}
        authors={data.authors}
        date={data.date}
        url={data.url}
        articleHighlights={data.articleHighlights}
      />

      <Footer {...getRouteFooterProps('/blog/:slug')} />
    </main>
  );
};

export default BlogDetails;
