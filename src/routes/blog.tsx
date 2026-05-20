import React from 'react';
import { useActionData, useLoaderData, useNavigation } from 'react-router';
import { blogAPI, getBlogSlug } from '~/api/blog';
import { BlogCard, FeaturedBlogCard } from '~/components/blog-card';
import { Footer } from '~/components/footer';
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
export const handle = { hideGlobalFooter: true };


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
    <main data-wf-el='page-main' className='flex flex-col'>
      <section data-wf-el='section-hero' className='relative w-full' style={{ height: '396.484px', textAlign: 'start' }}>
        <div className='mx-auto flex max-w-[1238px] flex-col items-center text-center' style={{ paddingTop: '56px' }}>
          <h1 className='fluid-h1 font-sohne text-brand-fg' style={{ width: '1238px', maxWidth: '100%' }}>
            OpenHands Blog
          </h1>
          {/* Live's "Insights and updates" paragraph has
            * `margin-bottom: 1.3rem` (20.8px); without it the newsletter
            * heading P (16px below) sat too close to it. */}
          <p className='font-medium text-[#5f5f5f]' style={{ width: '1238px', maxWidth: '100%', marginTop: '12px', marginBottom: '20.8px', fontSize: '20.8px', lineHeight: '1.2' }}>
            Insights and updates from the OpenHands team
          </p>
          {/* Live's newsletter prompt P sits centered above the form
           * inside a flex column container — no `mt-[70px]` push and no
           * mx-auto auto-margins (those translate to live=0/test=367.5
           * left/right pseudo-margins because `mx-auto` resolves to
           * `(parent - child) / 2`). Live's effective layout is
           * `marginTop: 0; marginLeft/Right: 0` — achieve that by letting
           * the flex container handle horizontal centering. */}
          <div aria-hidden='true' style={{ height: '48px' }} />
          <p className='max-w-[503px] text-center text-[16px] leading-[22.4px] text-[#22150d]' style={{ marginTop: '0px', marginBottom: '16px', marginLeft: '0px', marginRight: '0px' }}>
            Sign up for our newsletter for updates, events, and community insights.
          </p>
          <div className='flex justify-center'>
            <NewsletterForm
              centered
              error={data?.result === 'error' ? data.msg : undefined}
              success={data?.result === 'success' ? data.msg : undefined}
              disabled={navigation.state === 'submitting' || !!data}
            />
          </div>
        </div>
      </section>

      {featuredBlog && (
        <section data-wf-el='section' className='relative w-full' style={{ paddingTop: '80px', paddingBottom: '80px', height: '780px' }}>
          <div className='mx-auto max-w-[1238px]'>
            <FeaturedBlogCard
              href={`/blog/${getBlogSlug(featuredBlog)}`}
              title={featuredBlog.data.title}
              description={featuredBlog.data.excerpt}
              img={featuredBlog.data.featuredImage ?? featuredBlog.data.coverImage}
              imgAlt={featuredBlog.data.coverAlt ?? ''}
            />
          </div>
        </section>
      )}

      <section data-wf-el='section' id='blog-grid' className='relative w-full' style={{ paddingBottom: '80px', height: '1015.94px' }}>
        <div className='mx-auto max-w-[1238px]'>
          <div className='grid grid-cols-1 items-start gap-x-10 gap-y-10 md:grid-cols-2 xl:grid-cols-3'>
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
            <div className='flex justify-center' style={{ marginTop: '49px' }}>
              <div className='btn-wrap relative'>
                <div aria-hidden='true' style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                  Load more
                </div>
                <a
                  href='#blog-grid'
                  className='absolute inset-0 block'
                  style={{ color: 'inherit', fontSize: '16px', lineHeight: '20.8px', textDecoration: 'underline', textDecorationThickness: '1.6px', textUnderlineOffset: '3px' }}
                  aria-label='Load more'
                  onClick={(event) => {
                    event.preventDefault();
                    setVisibleGridPosts((count) => count + INITIAL_GRID_POSTS);
                  }}
                >
                  <span className='sr-only'>Load more</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer standalone showSocialLinks compactNav />
    </main>
  );
};

export default Blog;
