import { Link, useActionData, useLoaderData, useNavigation } from 'react-router';
import { blogAPI, getBlogSlug } from '~/api/blog';
import { BlogCard, FeaturedBlogCard } from '~/components/blog-card';
import { NewsletterForm } from '~/components/newsletter-form';
import { handleNewsletterSubscription } from '~/utils/newsletter-subscription';
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
  const { blogs } = useLoaderData() as { blogs: Post[] };
  const [latestBlog, ...remainingBlogs] = blogs;

  return (
    <main className='flex flex-col items-center px-5 pb-16 pt-[100px] lg:px-10'>
      <section className='w-full max-w-[640px] text-center'>
        <h1 className='font-inter text-[32px] leading-[1.1] font-medium tracking-[-0.03em] text-brand-fg lg:text-[44px]'>
          OpenHands Blog
        </h1>
        <p className='mt-3 text-[18px] leading-[1.2] font-medium text-[#5f5f5f] lg:text-[20px]'>
          Insights and updates from the OpenHands team
        </p>
        <p className='mt-8 text-[18px] leading-[1.5] text-[#5f5f5f]'>
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

      {latestBlog && (
        <section className='mt-14 w-full max-w-[1238px]'>
          <Link to={getBlogSlug(latestBlog)} className='block'>
            <FeaturedBlogCard
              title={latestBlog.data.title}
              description={latestBlog.data.excerpt}
              img={latestBlog.data.coverImage}
            />
          </Link>
        </section>
      )}

      <section className='mt-12 w-full max-w-[1238px]'>
        <div className='grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-2 xl:grid-cols-3'>
          {remainingBlogs.map((blog) => (
            <Link key={getBlogSlug(blog)} to={getBlogSlug(blog)} className='block'>
              <BlogCard
                title={blog.data.title}
                date={blog.data.date}
                img={blog.data.coverImage}
              />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Blog;
