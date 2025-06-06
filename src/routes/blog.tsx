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

export const meta: Route.MetaFunction = () => [
  { title: 'All Hands AI Blog - Insights and Innovations' },
  {
    name: 'description',
    content: 'Read the latest insights and innovations from All Hands AI.',
  },
];

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
    <main className='flex flex-col'>
      <section className='flex flex-col items-center'>
        <SectionHeading isHero subheading='OUR BLOG'>
          <NewsletterForm
            error={data?.result === 'error' ? data.msg : undefined}
            success={data?.result === 'success' ? data.msg : undefined}
            disabled={navigation.state === 'submitting' || !!data}
          />
        </SectionHeading>
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
