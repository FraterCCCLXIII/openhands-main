import React from 'react';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
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

export const ErrorBoundary = () => (
  <div className='flex flex-col items-center gap-4 text-center py-[45px]'>
    <h1 className='heading'>Error</h1>
    <p className='paragraph'>There was an error loading the blog.</p>
  </div>
);

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
    { property: 'og:site_name', content: 'All Hands AI' },
    { property: 'article:published_time', content: data.date },
    { property: 'article:author', content: data.authors.map((author) => author.name).join(', ') },
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
          name: 'All Hands AI',
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
    const baseWidth = window.innerWidth;
    const padding = baseWidth >= 1024 ? 84 : 40; // 42px or 20px padding on each side
    const maxWidth = Math.min(baseWidth - padding, 800); // Max width of 800px for larger screens
    setCodeElementWidth(maxWidth);
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
            remarkPlugins={[remarkMath, remarkGfm]}
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
              table: (props) => (
                <div className='overflow-x-auto my-6'>
                  <table className='min-w-full border-collapse border border-gray-300' {...props}>
                    {props.children}
                  </table>
                </div>
              ),
              thead: (props) => (
                <thead className='bg-gray-50' {...props}>
                  {props.children}
                </thead>
              ),
              tbody: (props) => (
                <tbody {...props}>
                  {props.children}
                </tbody>
              ),
              tr: (props) => (
                <tr className='border-b border-gray-200' {...props}>
                  {props.children}
                </tr>
              ),
              th: (props) => (
                <th className='border border-gray-300 px-4 py-2 text-left font-semibold bg-gray-100' {...props}>
                  {props.children}
                </th>
              ),
              td: (props) => (
                <td className='border border-gray-300 px-4 py-2' {...props}>
                  {props.children}
                </td>
              ),
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
