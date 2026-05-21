import React from 'react';
import { useActionData, useLoaderData, useNavigation } from 'react-router';
import { blogAPI, getBlogSlug } from '~/api/blog';
import { BlogCard, FeaturedBlogCard } from '~/components/blog-card';
import { Footer } from '~/components/footer';
import { NewsletterForm } from '~/components/newsletter-form';
import { handleNewsletterSubscription } from '~/utils/newsletter-subscription';
import type { Route } from './+types/blog';

const INITIAL_GRID_POSTS = 6;
const BLOG_GRID_VERTICAL_OFFSETS = [12.5, 25, 0, 0, 12.5, 0] as const;

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
        <div data-wf-el='hero-content' className='relative flex h-full w-full flex-col items-center justify-center text-center' style={{ paddingTop: '56px', paddingBottom: '56px' }}>
          <div data-wf-el='container' className='mx-auto max-w-[1238px] text-center' style={{ height: '284.48px' }}>
            <h1 className='fluid-h1 font-sohne text-brand-fg' style={{ width: '1238px', maxWidth: '100%' }}>
              OpenHands Blog
            </h1>
            {/* Live's "Insights and updates" paragraph has
              * `margin-bottom: 1.3rem` (20.8px); without it the newsletter
              * heading P (16px below) sat too close to it. */}
            <p data-wf-el='paragraph-lg' className='font-medium text-[#5f5f5f]' style={{ width: '1238px', maxWidth: 'none', marginTop: '12px', marginBottom: '20.8px', fontSize: '20.8px', lineHeight: '1.2' }}>
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
            <div data-wf-el='align-center' className='flex w-full items-center justify-center'>
              <p className='max-w-[503px] text-center text-[16px] leading-[22.4px] text-[#22150d]' style={{ marginTop: '0px', marginBottom: '16px', marginLeft: '0px', marginRight: '0px' }}>
                Sign up for our newsletter for updates, events, and community insights.
              </p>
            </div>
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
          <div data-wf-el='container' className='mx-auto max-w-[1238px]'>
            <div data-wf-el='standard-collection'>
              <div data-wf-el='standard-collection-list'>
                <div data-wf-el='standard-collection-list-item' style={{ justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <FeaturedBlogCard
                    href={`/blog/${getBlogSlug(featuredBlog)}`}
                    title={featuredBlog.data.title}
                    description={featuredBlog.data.excerpt}
                    img={featuredBlog.data.featuredImage ?? featuredBlog.data.coverImage}
                    imgAlt={featuredBlog.data.coverAlt ?? ''}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section data-wf-el='section' id='blog-grid' className='relative w-full' style={{ paddingBottom: '80px', height: '1015.94px' }}>
        <div data-wf-el='standard-collection' className='mx-auto max-w-[1238px]'>
          <div data-wf-el='standard-collection-list' className='flex flex-wrap' style={{ marginLeft: '-20px', marginRight: '-20px', rowGap: '40px' }}>
            {visibleBlogs.map((blog, index) => {
              return (
                <div key={getBlogSlug(blog)} data-wf-el='standard-collection-list-item' className='relative flex w-full items-center justify-between md:w-1/2 xl:w-1/3' style={{ maxWidth: '33.3333%', paddingLeft: '20px', paddingRight: '20px', gap: '16px' }}>
                  <BlogCard
                    href={`/blog/${getBlogSlug(blog)}`}
                    title={blog.data.title}
                    date={blog.data.date}
                    img={blog.data.coverImage}
                    imgAlt={blog.data.coverAlt ?? ''}
                    webflowIndexCard
                    verticalOffset={BLOG_GRID_VERTICAL_OFFSETS[index] ?? 0}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {hasMoreBlogs && (
          <div style={{ marginTop: '49px' }}>
            <div data-wf-el='container' className='mx-auto max-w-[1238px]'>
              <div className='flex justify-center'>
                <div data-wf-el='button' className='btn-wrap relative' style={{ marginBottom: '10px', cursor: 'auto' }}>
                <div data-wf-el='btn-text' aria-hidden='true' style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}>
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
            </div>
          </div>
        )}
      </section>

      <Footer standalone showSocialLinks compactNav compactNavSpacerHeight={9.36} standaloneContainerHeight={950} standaloneContainerFlowSpacerHeight={41} />
    </main>
  );
};

export default Blog;
