import React from 'react';
import {
  redirect,
  type LoaderFunctionArgs,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from 'react-router';
import { blogAPI } from '~/api/blog';
import { BlogFooter } from '~/components/blog-footer';
import { CMarkdown } from '~/components/c-markdown';
import { PlaceholderImage } from '~/components/placeholder-image';
import { getOpenHandsBlogUrl, resolveBlogSlug } from '~/utils/blog-slug-aliases';
import { formatDate } from '~/utils/format-date';
import { handleNewsletterSubscription } from '~/utils/newsletter-subscription';
import type { Route } from './+types/blog.$slug';
import 'katex/dist/katex.min.css';

export const action = handleNewsletterSubscription;

export const loader = ({ params, request }: LoaderFunctionArgs) => {
  if (!params.slug) {
    throw new Response('Blog not found', { status: 404 });
  }

  const slug = params.slug.toString();
  const resolvedSlug = resolveBlogSlug(slug);
  const blog = blogAPI.getBlogBySlug(resolvedSlug);

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
    authors: data.authors.map((author) => ({
      name: author.name,
      picture: author.picture || null,
      link: author.link || null,
    })),
    excerpt: data.excerpt,
    ogImage: data.ogImage.url.startsWith('http') ? data.ogImage.url : origin + data.ogImage.url,
    url,
  };
};

export const ErrorBoundary = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <div className='flex flex-col items-center gap-4 py-[45px] text-center'>
        <h1 className='font-inter text-[32px] leading-[1.1] font-medium tracking-[-0.03em] lg:text-[44px]'>
          404
        </h1>
        <p className='text-[18px] leading-[1.5] text-[#5f5f5f]'>Blog post not found.</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center gap-4 py-[45px] text-center'>
      <h1 className='font-inter text-[32px] leading-[1.1] font-medium tracking-[-0.03em] lg:text-[44px]'>
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
    { title: data.title },
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
    { rel: 'canonical', href: data.url },
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
    <article className='flex flex-col items-center px-5 pb-16 pt-[100px] lg:px-10'>
      <div className='w-full max-w-[960px]'>
        <figure className='w-full'>
          {!data.cover && <PlaceholderImage className='aspect-[3/2] w-full rounded-[16px]' />}
          {data.cover && (
            <img
              src={data.cover}
              alt='blog cover'
              className='aspect-[3/2] w-full rounded-[16px] object-cover'
            />
          )}
        </figure>
      </div>

      <main className='mt-10 flex w-full max-w-[960px] flex-col gap-10'>
        <header className='mx-auto flex w-full max-w-[820px] flex-col gap-6'>
          <h1 className='font-inter text-[32px] leading-[1.1] font-medium tracking-[-0.03em] text-brand-fg lg:text-[44px]'>
            {data.title}
          </h1>

          <div className='grid grid-cols-1 gap-4 border-t border-black/10 pt-6 md:grid-cols-2'>
            <div>
              <p className='m-0 text-[14px] leading-[1.5] text-[#5f5f5f]'>Written by</p>
              <p className='mt-1 text-[18px] leading-[1.2] font-medium text-brand-fg'>
                {data.authors.map((author, index) => {
                  const content = author.link ? (
                    <a
                      href={author.link}
                      className='text-brand-brown underline decoration-[1px] underline-offset-[0.18em] transition-colors hover:text-brand-fg'
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
              <p className='m-0 text-[14px] leading-[1.5] text-[#5f5f5f]'>Published on</p>
              <time
                dateTime={data.date}
                className='mt-1 block text-[18px] leading-[1.2] font-medium text-brand-fg'
              >
                {formatDate(data.date)}
              </time>
            </div>
          </div>
        </header>

        <section className='mx-auto w-full max-w-[820px]'>
          <CMarkdown variant='blog' codeElementWidth={codeElementWidth}>
            {data.content}
          </CMarkdown>

          <BlogFooter
            title={data.title}
            authors={data.authors}
            date={data.date}
            url={data.url}
          />
        </section>
      </main>
    </article>
  );
};

export default BlogDetails;
