import React from 'react';
import { useActionData, useLoaderData, useNavigation } from 'react-router';
import { blogAPI, getBlogSlug } from '~/api/blog';
import { BlogCard, FeaturedBlogCard } from '~/components/blog-card';
import { Footer } from '~/components/footer';
import { getRouteFooterProps } from '~/constants/route-layout';
import { NewsletterForm } from '~/components/newsletter-form';
import { handleNewsletterSubscription } from '~/utils/newsletter-subscription';
import { getBlogPreviewText } from '~/utils/blog-preview';
import { createSocialPreviewMeta } from '~/utils/seo';
import type { Route } from './+types/blog';

const INITIAL_GRID_POSTS = 6;
const BLOG_META_TITLE =
  'OpenHands Blog | Cloud Coding Agents, AI Development, and Open Source Insights';
const BLOG_META_DESCRIPTION =
  'Explore the latest in cloud coding agents, autonomous development, and open-source engineering. Deep dives, tutorials, benchmarks, and OpenHands product updates.';

export const loader = async () => {
  const featuredBlog = blogAPI.getFeaturedBlog() ?? null;
  const gridBlogs = blogAPI.getBlogGridBlogs();

  return { featuredBlog, gridBlogs };
};

export const action = handleNewsletterSubscription;
export const handle = { hideGlobalFooter: true };


export const meta: Route.MetaFunction = ({ location }) =>
  createSocialPreviewMeta({
    title: BLOG_META_TITLE,
    description: BLOG_META_DESCRIPTION,
    pathname: location.pathname,
  });

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
  const isBlogGridExpanded = visibleGridPosts > INITIAL_GRID_POSTS;

  return (
    <main
      data-wf-el='page-main'
      className={`blog-index-page flex flex-col${isBlogGridExpanded ? ' blog-index-page--expanded' : ''}`}
    >
      <section data-wf-el='section-hero' className='blog-hero relative w-full' style={{ textAlign: 'start' }}>
        <div
          data-wf-el='hero-content'
          className='relative w-full'
          style={{ paddingTop: '56px', paddingBottom: '56px' }}
        >
          <div
            data-wf-el='container'
            className='blog-hero-container mx-auto w-full max-w-[1238px] px-5 text-left md:px-10'
          >
            <h1 className='fluid-h1 font-sohne text-left text-brand-fg'>OpenHands Blog</h1>
            <p
              data-wf-el='paragraph-lg'
              className='blog-hero-subtitle max-w-[720px] text-left font-medium text-[#5f5f5f]'
              style={{ marginTop: '12px', marginBottom: 0, fontSize: '20.8px', lineHeight: '1.2' }}
            >
              Insights and updates from the OpenHands team
            </p>
          </div>
        </div>
      </section>

      {featuredBlog && (
        <section data-wf-el='section' className='blog-featured-section relative w-full' style={{ paddingBottom: '80px' }}>
          <div data-wf-el='container' className='blog-section-container mx-auto w-full max-w-[1238px] px-5 md:px-10'>
            <div className='blog-featured-layout grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12'>
              <div data-wf-el='standard-collection' className='min-w-0'>
                <div data-wf-el='standard-collection-list'>
                  <div
                    data-wf-el='standard-collection-list-item'
                    className='border-y border-[rgba(24,24,24,0.12)]'
                    style={{ justifyContent: 'space-between', alignItems: 'start', gap: '16px' }}
                  >
                    <FeaturedBlogCard
                      href={`/blog/${getBlogSlug(featuredBlog)}`}
                      title={featuredBlog.data.title}
                      description={getBlogPreviewText(featuredBlog)}
                    />
                  </div>
                </div>
              </div>

              <aside className='blog-featured-newsletter rounded-2xl border border-[rgba(24,24,24,0.12)] bg-[rgba(255,255,255,0.72)] p-6 md:p-7 lg:sticky lg:top-8'>
                <div data-wf-el='align-center' className='blog-newsletter-prompt mb-4'>
                  <p
                    className='text-center text-[16px] leading-[22.4px] text-[#181818]'
                    style={{ margin: '0 0 16px' }}
                  >
                    Sign up for our newsletter for updates, events, and community insights.
                  </p>
                </div>
                <NewsletterForm
                  centered
                  error={data?.result === 'error' ? data.msg : undefined}
                  success={data?.result === 'success' ? data.msg : undefined}
                  disabled={navigation.state === 'submitting' || !!data}
                />
              </aside>
            </div>
          </div>
        </section>
      )}

      <section data-wf-el='section' id='blog-grid' className='blog-grid-section relative w-full' style={{ paddingBottom: '80px' }}>
        <div data-wf-el='standard-collection' className='blog-grid-collection mx-auto w-full max-w-[1238px] px-5 md:px-10'>
          <div data-wf-el='standard-collection-list' className='blog-grid-list grid grid-cols-1 gap-y-10 md:grid-cols-2 md:gap-x-10 xl:grid-cols-3'>
            {visibleBlogs.map((blog) => {
              return (
                <div key={getBlogSlug(blog)} data-wf-el='standard-collection-list-item' className='blog-grid-item min-w-0'>
                  <BlogCard
                    href={`/blog/${getBlogSlug(blog)}`}
                    title={blog.data.title}
                    date={blog.data.date}
                    excerpt={getBlogPreviewText(blog)}
                    webflowIndexCard
                  />
                </div>
              );
            })}
          </div>
        </div>

        {hasMoreBlogs && (
          <div style={{ marginTop: '49px' }}>
            <div data-wf-el='container' className='blog-load-more-container mx-auto w-full max-w-[1238px] px-5 md:px-10'>
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
                    setVisibleGridPosts((count) => Math.min(count + INITIAL_GRID_POSTS, gridBlogs.length));
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

      <Footer {...getRouteFooterProps('/blog')} />
    </main>
  );
};

export default Blog;
