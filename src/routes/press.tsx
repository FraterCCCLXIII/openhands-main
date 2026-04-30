import { Link } from 'react-router';
import { CompanyPageShell } from '~/components/company-page-shell';
import type { Route } from './+types/press';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Newsroom | Press, Media, and Brand Resources' },
    {
      name: 'description',
      content:
        'Access the latest news, press releases, and brand assets from OpenHands, the open-source standard for cloud coding agents.',
    },
    { property: 'og:title', content: 'OpenHands Newsroom | Press, Media, and Brand Resources' },
    {
      property: 'og:description',
      content:
        'Access the latest news, press releases, and brand assets from OpenHands, the open-source standard for cloud coding agents.',
    },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const PRESS_ITEMS = [
  {
    date: 'November 18, 2025',
    title:
      'OpenHands Raises $18.8M Series A to Bring Open-Source Cloud Coding Agents to Enterprises',
    url: 'https://www.businesswire.com/news/home/20251118768131/en/OpenHands-Raises-%2418.8M-Series-A-to-Bring-Open-Source-Cloud-Coding-Agents-to-Enterprises',
    image: '/assets/webflow/blog/6925c7cdaac33e588733075c_blog-media.webp',
  },
  {
    date: 'September 8, 2024',
    title: 'All Hands AI Announces $5M to Advance Open-source AI Agents for Developers',
    url: 'https://theaiinsider.tech/2024/09/08/all-hands-ai-announces-5m-to-advance-open-source-ai-agents-for-developers/',
    image:
      'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69162ffa4334ae0267ee1c57_Screenshot%202025-11-13%20at%2011.22.26%20AM.png',
  },
  {
    date: 'September 8, 2024',
    title: 'All Hands AI raises $5M to build open source agents for developers',
    url: 'https://techcrunch.com/2024/09/05/all-hands-ai-raises-5m-to-build-open-source-agents-for-developers',
    image:
      'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/6915e88c874e7050ff5b8094_Screenshot%202025-11-13%20at%206.09.19%20AM.png',
  },
] as const;

const Press = () => {
  return (
    <CompanyPageShell>
      <section className='px-6 pb-24 pt-12 lg:px-10 lg:pb-24 lg:pt-12'>
        <div className='mx-auto max-w-[640px] text-center'>
          <h1 className='text-[37px] font-medium leading-[40.7px] tracking-[-0.03em] text-brand-fg lg:text-[44px] lg:leading-[48.4px]'>
            In the news
          </h1>
          <p className='mt-4 text-[20.8px] font-medium leading-[24.96px] text-[#5f5f5f]'>
            Read how OpenHands is reshaping the future of AI-powered software development.
          </p>
          <div className='mt-10 flex justify-center'>
            <div className='btn btn-primary rounded-none p-0'>
              <Link to='/contact' className='block bg-transparent px-4 py-4 text-brand-bg'>
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className='px-6 pb-28 lg:px-10 lg:pb-[16rem]'>
        <div className='mx-auto grid max-w-[1238px] gap-x-6 gap-y-14 md:grid-cols-2 xl:grid-cols-3'>
          {PRESS_ITEMS.map((item) => (
            <article key={item.title} className='flex flex-col gap-5'>
              <img src={item.image} alt='' className='h-[300px] w-full rounded-[8px] object-cover' />
              <p className='m-0 inline-block self-start text-[16px] leading-[22.4px] text-[#5f5f5f]'>{item.date}</p>
              <p className='m-0 max-w-[397px] text-[20.8px] font-medium leading-[24.96px] text-brand-fg'>
                {item.title}
              </p>
              <a href={item.url} target='_blank' rel='noopener noreferrer' className='btn btn-outline w-fit rounded-none'>
                Read more
              </a>
            </article>
          ))}
        </div>
      </section>
    </CompanyPageShell>
  );
};

export default Press;
