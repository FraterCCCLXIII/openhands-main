import { Link } from 'react-router';
import type { Route } from './+types/press';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Newsroom | Press, Media, and Brand Resources' },
    { name: 'description', content: 'Access the latest news, press releases, and brand assets from OpenHands, the open-source standard for cloud coding agents.' },
    { property: 'og:title', content: 'OpenHands Newsroom | Press, Media, and Brand Resources' },
    { property: 'og:description', content: 'Access the latest news, press releases, and brand assets from OpenHands, the open-source standard for cloud coding agents.' },
    { property: 'og:url', content: 'https://openhands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://openhands.dev' + location.pathname },
  ];
};

const PRESS_ITEMS = [
  {
    date: 'November 18, 2025',
    title: 'OpenHands Raises $18.8M Series A to Bring Open-Source Cloud Coding Agents to Enterprises',
    url: 'https://www.businesswire.com/news/home/20251118768131/en/OpenHands-Raises-%2418.8M-Series-A-to-Bring-Open-Source-Cloud-Coding-Agents-to-Enterprises',
    image: 'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/6925c7cdaac33e588733075c_blog-media.webp',
  },
  {
    date: 'September 8, 2024',
    title: 'All Hands AI Announces $5M to Advance Open-source AI Agents for Developers',
    url: 'https://theaiinsider.tech/2024/09/08/all-hands-ai-announces-5m-to-advance-open-source-ai-agents-for-developers/',
    image: 'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/69162ffa4334ae0267ee1c57_Screenshot%202025-11-13%20at%2011.22.26%20AM.png',
  },
  {
    date: 'September 8, 2024',
    title: 'All Hands AI raises $5M to build open source agents for developers',
    url: 'https://techcrunch.com/2024/09/05/all-hands-ai-raises-5m-to-build-open-source-agents-for-developers',
    image: 'https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/6915e88c874e7050ff5b8094_Screenshot%202025-11-13%20at%206.09.19%20AM.png',
  },
];

const Press = () => {
  return (
    <main className='pt-[100px]'>
      <section className='px-6 pb-10 pt-16 lg:px-10 lg:pb-12 lg:pt-24'>
        <div className='mx-auto max-w-[720px] text-center'>
          <h1 className='font-quincy text-[44px] font-normal leading-[0.95] tracking-[-0.04em] text-brand-fg lg:text-[60px]'>
            In the news
          </h1>
          <p className='mt-4 text-lg leading-[1.5] text-brand-muted'>
            Read how OpenHands is reshaping the future of AI-powered software development.
          </p>
          <div className='mt-8 flex justify-center'>
            <Link to='/contact' className='btn btn-primary rounded-none'>
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <section className='px-6 pb-16 lg:px-10 lg:pb-24'>
        <div className='mx-auto grid max-w-[1238px] gap-8 md:grid-cols-2 xl:grid-cols-3'>
          {PRESS_ITEMS.map((item) => (
            <article key={item.title} className='flex flex-col'>
              <div className='overflow-hidden rounded-[18px] border border-brand-border bg-brand-fg/5'>
                <img src={item.image} alt='' className='h-full w-full object-cover' />
              </div>
              <p className='mt-4 text-base leading-[1.5] text-brand-muted'>{item.date}</p>
              <h2 className='mt-2 text-[28px] font-medium leading-[1.2] tracking-[-0.03em] text-brand-fg'>
                {item.title}
              </h2>
              <div className='mt-4'>
                <a
                  href={item.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='btn btn-outline rounded-none text-sm'
                >
                  Read more
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
};

export default Press;
