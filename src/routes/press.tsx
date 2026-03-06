import { Link } from 'react-router';
import type { Route } from './+types/press';

export const meta: Route.MetaFunction = ({ location }) => {
  return [
    { title: 'OpenHands Newsroom | Press, Media, and Brand Resources' },
    { name: 'description', content: 'Access the latest news, press releases, and brand assets from OpenHands, the open-source standard for autonomous software development.' },
    { property: 'og:title', content: 'OpenHands Newsroom | Press, Media, and Brand Resources' },
    { property: 'og:description', content: 'Access the latest news, press releases, and brand assets from OpenHands, the open-source standard for autonomous software development.' },
    { property: 'og:url', content: 'https://www.all-hands.dev' + location.pathname },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { rel: 'canonical', href: 'https://www.all-hands.dev' + location.pathname },
  ];
};

const PRESS_RELEASES = [
  {
    date: 'November 2024',
    title: 'OpenHands Raises $18.8M Series A to Build the Open Standard for Autonomous Software Development',
    url: '/blog/weve-just-raised-18-8m-to-build-the-open-standard-for-autonomous-software-development',
    source: 'Company Announcement',
  },
  {
    date: 'October 2024',
    title: 'OpenHands Partners with AMD to Enable Local AI Coding Agents on Ryzen AI PCs',
    url: '/blog/openhands-amd-lemonade',
    source: 'Company Announcement',
  },
];

const MEDIA_COVERAGE = [
  {
    title: 'The Rise of AI Coding Agents',
    source: 'TechCrunch',
    date: 'November 2024',
    url: '#',
  },
  {
    title: 'Open Source AI Tools Gaining Enterprise Traction',
    source: 'InfoWorld',
    date: 'October 2024',
    url: '#',
  },
];

const Press = () => {
  return (
    <main className='pt-[100px]'>
      {/* Hero Section */}
      <section className='px-10 py-20 lg:py-32 text-center max-w-4xl mx-auto'>
        <h1 className='text-4xl lg:text-6xl font-bold mb-6'>
          In the news
        </h1>
        <p className='text-lg lg:text-xl text-brand-muted max-w-2xl mx-auto'>
          Latest news, press releases, and media coverage about OpenHands
        </p>
        <div className='flex gap-4 justify-center flex-wrap mt-8'>
          <Link to='https://app.all-hands.dev' className='btn btn-primary'>
            Try it live
          </Link>
          <Link to='https://docs.openhands.dev/sdk' className='btn btn-outline'>
            Build with SDK
          </Link>
        </div>
      </section>

      {/* Press Releases */}
      <section className='px-10 py-20 max-w-4xl mx-auto'>
        <div className='section-title mb-12'>Press Releases</div>
        <div className='space-y-8'>
          {PRESS_RELEASES.map((release) => (
            <a
              key={release.title}
              href={release.url}
              className='block border border-brand-border rounded-xl p-6 hover:bg-brand-fg/5 transition-colors'
            >
              <div className='flex items-center gap-4 mb-2'>
                <span className='text-sm text-brand-muted'>{release.date}</span>
                <span className='text-sm text-brand-accent'>{release.source}</span>
              </div>
              <div className='text-lg font-semibold hover:underline'>{release.title}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Media Kit */}
      <section className='px-10 py-20 bg-[#efe6d1]'>
        <div className='max-w-4xl mx-auto'>
          <div className='section-title mb-4'>Media Kit</div>
          <p className='text-brand-muted mb-8'>
            Download logos, screenshots, and brand guidelines for press use.
          </p>
          <div className='grid md:grid-cols-2 gap-6'>
            <div className='bg-brand-bg rounded-xl p-6'>
              <div className='font-semibold mb-2'>Logo Package</div>
              <p className='text-sm text-brand-muted mb-4'>
                OpenHands logos in various formats (SVG, PNG)
              </p>
              <button className='btn btn-outline text-sm'>Download</button>
            </div>
            <div className='bg-brand-bg rounded-xl p-6'>
              <div className='font-semibold mb-2'>Brand Guidelines</div>
              <p className='text-sm text-brand-muted mb-4'>
                Color palette, typography, and usage guidelines
              </p>
              <button className='btn btn-outline text-sm'>Download</button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className='px-10 py-20 text-center'>
        <div className='max-w-2xl mx-auto'>
          <div className='section-title mb-6'>Press Inquiries</div>
          <p className='text-brand-muted mb-8'>
            For press and media inquiries, please contact us at:
          </p>
          <a href='mailto:press@all-hands.dev' className='text-xl font-semibold hover:underline'>
            press@all-hands.dev
          </a>
        </div>
      </section>
    </main>
  );
};

export default Press;
