import React from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import { type LoaderFunctionArgs, useLoaderData } from 'react-router';
import invariant from 'tiny-invariant';
import { blogAPI } from '~/api/blog';
import { PlaceholderImage } from '~/components/placeholder-image';
import { formatDate } from '~/utils/format-date';
import { BlogFooter } from '~/components/blog-footer';
import { handleNewsletterSubscription } from '~/utils/newsletter-subscription';
import 'katex/dist/katex.min.css';
import type { Route } from './+types/blog.$slug';
import { LazyCode } from '~/components/lazy-code';

export const action = handleNewsletterSubscription;

export const loader = ({ params, request }: LoaderFunctionArgs) => {
  invariant(params.slug, 'No blog ID provided');

  const slug = params.slug.toString();
  const blog = blogAPI.getBlogBySlug(slug);

  invariant(blog, 'No blog found');
  const { content, data } = blog;

  // Get the current URL for citation
  const url = new URL(request.url).origin + '/blog/' + slug;

  return {
    content,
    title: data.title,
    date: data.date,
    cover: data.coverImage || null,
    authors: data.authors.map((author) => ({
      name: author.name,
      link: author.link || null,
    })),
    excerpt: data.excerpt,
    ogImage: data.ogImage.url,
    url,
  };
};

export const ErrorBoundary = () => (
  <div className='flex flex-col items-center gap-4 text-center py-[45px]'>
    <h1 className='heading'>Error</h1>
    <p className='paragraph'>There was an error loading the blog.</p>
  </div>
);

export const meta: Route.MetaFunction = ({ data }) => [
  { title: data.title },
  {
    name: 'description',
    content: data.excerpt,
  },
  {
    property: 'og:image',
    content: data.ogImage,
  },
  {
    property: 'og:title',
    content: data.title,
  },
  {
    property: 'og:description',
    content: data.excerpt,
  },
  {
    property: 'og:url',
    content: data.url,
  },
  {
    name: 'twitter:image',
    content: data.ogImage,
  },
  {
    name: 'twitter:title',
    content: data.title,
  },
  {
    name: 'twitter:description',
    content: data.excerpt,
  },
  {
    name: 'twitter:url',
    content: data.url,
  },
];

const BlogDetails = () => {
  const data = useLoaderData() as ReturnType<typeof loader>;
  const codeElementWidth = React.useMemo(() => {
    const baseWidth = window.innerWidth;
    const padding = baseWidth >= 1024 ? 84 : 40; // 42px or 20px padding on each side
    const maxWidth = Math.min(baseWidth - padding, 800); // Max width of 800px for larger screens
    return maxWidth;
  }, []);

  return (
    <article className='flex flex-col items-center py-[30px] lg:py-[45px] gap-4 lg:gap-8'>
      <figure className='w-full lg:max-w-[800px] px-[20px] lg:px-[42px]'>
        {!data.cover && <PlaceholderImage className='aspect-video' />}
        {data.cover && (
          <img
            src={data.cover}
            alt='blog cover'
            className='w-full rounded-[7px] lg:rounded-[10px] flex items-center justify-center aspect-video object-cover'
          />
        )}
      </figure>

      <main className='flex flex-col gap-4 w-full lg:max-w-[800px] px-[20px] lg:px-[42px]'>
        <h1 className='heading font-bold'>{data.title}</h1>

        <header className='flex flex-col gap-2'>
          <div className='flex items-center gap-2 lg:gap-4 text-[17px] leading-6 font-semibold text-description'>
            <div className='flex flex-col items-start lg:flex-row lg:items-center lg:gap-4'>
              <span>
                By{' '}
                {data.authors.map((author, index) => (
                  <React.Fragment key={author.name}>
                    {index > 0 && ', '}
                    <a
                      href={author.link || undefined}
                      className='text-blue-600'
                      target='_blank'
                      rel='noreferrer'
                    >
                      {author.name}
                    </a>
                  </React.Fragment>
                ))}
              </span>
              <span className='hidden lg:block'>&#8226;</span>
              <time dateTime={data.date}>{formatDate(data.date)}</time>
            </div>
          </div>
        </header>

        <section className='paragraph flex flex-col gap-4'>
          <Markdown
            children={data.content}
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
            components={{
              a: (props) => (
                <a
                  rel='noreferrer'
                  target='_blank'
                  className='text-blue-600'
                  {...props}
                >
                  {props.children}
                </a>
              ),
              h2: (props) => (
                <h2 className='font-quincy font-bold text-5xl' {...props}>
                  {props.children}
                </h2>
              ),
              h3: (props) => (
                <h3 className='font-quincy font-bold text-3xl' {...props}>
                  {props.children}
                </h3>
              ),
              li: (props) => (
                <li className='list-disc ml-5' {...props}>
                  {props.children}
                </li>
              ),
              img: (props) => (
                <img className='rounded-lg' {...props} alt={props.alt} />
              ),
              p: (props) => (
                <p className='text-description' {...props}>
                  {props.children}
                </p>
              ),
              code: ({ children, className }) => (
                <LazyCode
                  className={className}
                  customStyle={{ maxWidth: codeElementWidth }}
                >
                  {children}
                </LazyCode>
              ),
              iframe: (props) => {
                const { node, ...rest } = props;
                return (
                  <div className='w-full flex justify-center my-4'>
                    <iframe {...rest} />
                  </div>
                );
              },
            }}
          />

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
