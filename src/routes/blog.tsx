import React from 'react';
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router';
import { blogAPI } from '~/api/blog';
import { BlogCard, FeaturedBlogCard } from '~/components/blog-card';
import { NewsletterForm } from '~/components/newsletter-form';
import { RegularButton } from '~/components/regular-button';
import { SectionHeading } from '~/components/section-heading';
import { useWidth } from '~/hooks/use-media';
import { handleNewsletterSubscription } from '~/utils/newsletter-subscription';
import { stringToSlug } from '~/utils/string-to-slug';
import type { Route } from './+types/blog';

export const loader = async () => {
  const blogs = blogAPI.getAllBlogs();
  blogs.sort(
    (a, b) => new Date(b.data.date).getTime() - new Date(a.data.date).getTime()
  );
  return { blogs };
};

export const action = handleNewsletterSubscription;

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Blog | Cloud Coding Agents, AI Development, and Open Source Insights' },
    { name: 'description', content: 'Explore the latest in cloud coding agents, autonomous development, and open-source engineering. Deep dives, tutorials, and news from the OpenHands team.' },
    { property: 'og:title', content: 'OpenHands Blog | Cloud Coding Agents, AI Development, and Open Source Insights' },
    { property: 'og:description', content: 'Explore the latest in cloud coding agents, autonomous development, and open-source engineering. Deep dives, tutorials, and news from the OpenHands team.' },
    { property: 'og:image', content: 'https://www.all-hands.dev/assets/all-hands-text-logo.png' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: 'OpenHands' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'OpenHands Blog | Cloud Coding Agents, AI Development, and Open Source Insights' },
    { name: 'twitter:description', content: 'Explore the latest in cloud coding agents, autonomous development, and open-source engineering. Deep dives, tutorials, and news from the OpenHands team.' },
    { name: 'twitter:image', content: 'https://www.all-hands.dev/assets/all-hands-text-logo.png' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const Blog = () => {
  const navigation = useNavigation();
  const data = useActionData<typeof action>();
  const { blogs } = useLoaderData() as { blogs: Post[] };
  const latestBlog = blogs[0];

  const width = useWidth();
  const [visibleCount, setVisibleCount] = React.useState(3);

  const loadMoreBlogs = () => {
    setVisibleCount((prev) => prev + 3);
  };

  return (
    <main className='flex flex-col pt-[100px]'>
      <section className='flex flex-col items-center py-16 px-10'>
        <h1 className='text-4xl lg:text-6xl font-bold mb-6 text-center'>OpenHands Blog</h1>
        <p className='text-lg text-brand-muted text-center mb-8 max-w-2xl'>
          Explore the latest in cloud coding agents, autonomous development, and open-source engineering.
        </p>
        <div className='flex gap-4 justify-center flex-wrap mb-8'>
          <a href='https://app.all-hands.dev' className='btn btn-primary'>
            Try it live
          </a>
          <a href='https://docs.openhands.dev/sdk' className='btn btn-outline'>
            Build with SDK
          </a>
        </div>
        <NewsletterForm
          error={data?.result === 'error' ? data.msg : undefined}
          success={data?.result === 'success' ? data.msg : undefined}
          disabled={navigation.state === 'submitting' || !!data}
        />
      </section>

      <section className='max-w-[1440px] monitor:self-center'>
        <section className='hidden lg:block'>
          <Link to={stringToSlug(latestBlog.data.title)}>
            <FeaturedBlogCard
              title={latestBlog.data.title}
              description={latestBlog.data.excerpt}
              img={latestBlog.data.coverImage}
            />
          </Link>
        </section>

        <section className='flex flex-col items-center'>
          <div className='grid grid-cols-1 lg:grid-cols-3'>
            {blogs
              .slice(
                width >= 1024 ? 1 : 0,
                visibleCount + (width >= 1024 ? 1 : 0)
              )
              .map((blog) => (
                <Link
                  key={stringToSlug(blog.data.title)}
                  to={stringToSlug(blog.data.title)}
                >
                  <BlogCard
                    title={blog.data.title}
                    description={blog.data.excerpt}
                    img={blog.data.coverImage}
                  />
                </Link>
              ))}
          </div>

          {visibleCount < blogs.length && (
            <div className='py-[45px]'>
              <RegularButton onClick={loadMoreBlogs}>Load More</RegularButton>
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default Blog;
