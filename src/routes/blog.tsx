import React from 'react';
import { useActionData, useLoaderData, useNavigation } from 'react-router';
import { blogAPI, getBlogSlug } from '~/api/blog';
import { BlogCard, FeaturedBlogCard } from '~/components/blog-card';
import { MarketingFooterCta } from '~/components/marketing-footer-cta';
import { NewsletterForm } from '~/components/newsletter-form';
import { handleNewsletterSubscription } from '~/utils/newsletter-subscription';
import type { Route } from './+types/blog';

const INITIAL_GRID_POSTS = 6;

export const loader = async () => {
  const featuredBlog = blogAPI.getFeaturedBlog() ?? null;
  const gridBlogs = blogAPI.getBlogGridBlogs();

  return { featuredBlog, gridBlogs };
};

export const action = handleNewsletterSubscription;

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    {
      title:
        'OpenHands Blog | Cloud Coding Agents, AI Development, and Open Source Insights',
    },
    {
      name: 'description',
      content:
        'Explore the latest in cloud coding agents, autonomous development, and open-source engineering. Deep dives, tutorials, benchmarks, and OpenHands product updates.',
    },
    {
      property: 'og:title',
      content:
        'OpenHands Blog | Cloud Coding Agents, AI Development, and Open Source Insights',
    },
    {
      property: 'og:description',
      content:
        'Explore the latest in cloud coding agents, autonomous development, and open-source engineering. Deep dives, tutorials, benchmarks, and OpenHands product updates.',
    },
    {
      property: 'og:image',
      content:
        'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
    },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    {
      name: 'twitter:title',
      content:
        'OpenHands Blog | Cloud Coding Agents, AI Development, and Open Source Insights',
    },
    {
      name: 'twitter:description',
      content:
        'Explore the latest in cloud coding agents, autonomous development, and open-source engineering. Deep dives, tutorials, benchmarks, and OpenHands product updates.',
    },
    {
      name: 'twitter:image',
      content:
        'https://openhands.dev/assets/webflow/og/69161b32abf448a2df921a73_openhands_opengraph_01.png',
    },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const Blog = () => {
  const navigation = useNavigation();
  const data = useActionData<typeof action>();
  const { featuredBlog, gridBlogs } = useLoaderData() as {
    featuredBlog: Post | null;
    gridBlogs: Post[];
  };
  const [visibleGridPosts, setVisibleGridPosts] = React.useState(INITIAL_GRID_POSTS);
  const visibleBlogs = gridBlogs.slice(0, visibleGridPosts);
  const hasMoreBlogs = visibleGridPosts < gridBlogs.length;

  return (
    <main data-wf-el='page-main' className='flex flex-col items-center px-5 pb-16 pt-[40px] lg:px-10'>
      <section className='w-full max-w-[1238px] text-center'>
        <h1 className='fluid-h1 font-sohne text-brand-fg'>
          OpenHands Blog
        </h1>
        <p className='mt-3 text-[18px] leading-[1.2] font-medium text-[#5f5f5f] lg:text-[20px]'>
          Insights and updates from the OpenHands team
        </p>
        <p className='mx-auto mt-[70px] max-w-[503px] text-[16px] leading-[22.4px] text-[#22150d]'>
          Sign up for our newsletter for updates, events, and community insights.
        </p>
        <div className='mt-4 flex justify-center'>
          <NewsletterForm
            centered
            error={data?.result === 'error' ? data.msg : undefined}
            success={data?.result === 'success' ? data.msg : undefined}
            disabled={navigation.state === 'submitting' || !!data}
          />
        </div>
      </section>

      {featuredBlog && (
        <section className='mt-[140px] w-full max-w-[1238px]'>
          <FeaturedBlogCard
            href={`/blog/${getBlogSlug(featuredBlog)}`}
            title={featuredBlog.data.title}
            description={featuredBlog.data.excerpt}
            img={featuredBlog.data.featuredImage ?? featuredBlog.data.coverImage}
            imgAlt={featuredBlog.data.coverAlt ?? ''}
          />
        </section>
      )}

      <section id='blog-grid' className='mt-20 w-full max-w-[1238px]'>
        <div className='grid grid-cols-1 gap-x-8 gap-y-20 md:grid-cols-2 xl:grid-cols-3'>
          {visibleBlogs.map((blog) => (
            <BlogCard
              key={getBlogSlug(blog)}
              href={`/blog/${getBlogSlug(blog)}`}
              title={blog.data.title}
              date={blog.data.date}
              img={blog.data.coverImage}
              imgAlt={blog.data.coverAlt ?? ''}
            />
          ))}
        </div>

        {hasMoreBlogs && (
          <div className='mt-16 flex justify-center'>
            <a
              href='#blog-grid'
              className='btn btn-outline border-none rounded-none'
              onClick={(event) => {
                event.preventDefault();
                setVisibleGridPosts((count) => count + INITIAL_GRID_POSTS);
              }}
            >
              Load more
            </a>
          </div>
        )}
      </section>

      <div className='mt-6 w-full'>
        <MarketingFooterCta semanticHeading={false} />
      </div>
    </main>
  );
};

export default Blog;
