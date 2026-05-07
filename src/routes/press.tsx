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
      '/assets/webflow/blog/69162ffa4334ae0267ee1c57_Screenshot_2025-11-13_at_11.22.26_AM.png',
  },
  {
    date: 'September 8, 2024',
    title: 'All Hands AI raises $5M to build open source agents for developers',
    url: 'https://techcrunch.com/2024/09/05/all-hands-ai-raises-5m-to-build-open-source-agents-for-developers',
    image:
      '/assets/webflow/blog/6915e88c874e7050ff5b8094_Screenshot_2025-11-13_at_6.09.19_AM.png',
  },
] as const;

const Press = () => {
  return (
    <CompanyPageShell>
      <section data-wf-el='section-hero' className='pb-0 pt-0'>
        {/* Live wraps hero in `.hero-content` (`padding: 4rem 0 4rem`); replicate
            with pt/pb on the inner content wrapper so the H1's top:140 matches. */}
        <div className='mx-auto max-w-[640px] pb-16 pt-14 text-center'>
          <h1 className='fluid-h1 text-brand-fg'>
            In the news
          </h1>
          <p className='mt-4 fluid-body-lg font-medium text-[#5f5f5f]'>
            Read how OpenHands is reshaping the future of AI-powered software development.
          </p>
          <div className='mt-10 flex justify-center'>
            <div className='btn btn-primary relative rounded-none'>
              <span aria-hidden='true'>Contact Us</span>
              <Link
                to='/contact'
                className='absolute inset-0 flex items-center justify-center bg-transparent text-brand-bg'
                style={{ borderStyle: 'none' }}
                aria-label='Contact Us'
              >
                <span className='sr-only'>Contact Us</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section data-wf-el='section' className='pb-20'>
        <div className='mx-auto grid max-w-[1238px] gap-x-6 gap-y-14 md:grid-cols-2 xl:grid-cols-3'>
          {PRESS_ITEMS.map((item) => (
            <article key={item.title} className='flex flex-col gap-5'>
              <img src={item.image} alt='' className='h-[300px] w-full object-cover' style={{ borderRadius: '0px', display: 'inline-block' }} />
              <p className='m-0 inline-block text-[16px] leading-[22.4px] text-[#5f5f5f]'>{item.date}</p>
              <p className='m-0 max-w-[397px] fluid-body-lg font-medium text-brand-fg'>
                {item.title}
              </p>
              <a href={item.url} target='_blank' rel='noopener noreferrer' className='btn btn-outline border-none w-fit rounded-none'>
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
