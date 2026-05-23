import { Link } from 'react-router';
import { CompanyPageShell } from '~/components/company-page-shell';
import type { Route } from './+types/press';
import { createSocialPreviewMeta } from '~/utils/seo';

export const meta: Route.MetaFunction = ({ location }) =>
  createSocialPreviewMeta({
    title: 'OpenHands Newsroom | Press, Media, and Brand Resources',
    description:
      'Access the latest news, press releases, and brand assets from OpenHands, the open-source standard for cloud coding agents.',
    pathname: location.pathname,
  });

const PRESS_ITEMS = [
  {
    date: 'May 6, 2026',
    title: 'OpenHands Launches an Agent Control Plane to Manage Software Agents',
    url: 'https://www.businesswire.com/news/home/20260506314667/en/OpenHands-Launches-an-Agent-Control-Plane-to-Manage-Software-Agents',
    image: '/assets/webflow/press/69fc7ec60f00b83c7a94d04f_CleanShot_2026-05-07_at_07.59.49_2x.png',
    srcSet:
      '/assets/webflow/press/69fc7ec60f00b83c7a94d04f_CleanShot_2026-05-07_at_07.59.49_2x-p-1600.png 1600w',
  },
  {
    date: 'November 18, 2025',
    title:
      'OpenHands Raises $18.8M Series A to Bring Open-Source Cloud Coding Agents to Enterprises',
    url: 'https://www.businesswire.com/news/home/20251118768131/en/OpenHands-Raises-%2418.8M-Series-A-to-Bring-Open-Source-Cloud-Coding-Agents-to-Enterprises',
    image: '/assets/webflow/press/6925c7cdaac33e588733075c_blog-media.webp',
    srcSet:
      '/assets/webflow/press/6925c7cdaac33e588733075c_blog-media-p-1600.webp 1600w',
  },
  {
    date: 'September 8, 2024',
    title: 'All Hands AI Announces $5M to Advance Open-source AI Agents for Developers',
    url: 'https://theaiinsider.tech/2024/09/08/all-hands-ai-announces-5m-to-advance-open-source-ai-agents-for-developers/',
    image:
      '/assets/webflow/press/69162ffa4334ae0267ee1c57_Screenshot_2025-11-13_at_11.22.26_AM.png',
    srcSet:
      '/assets/webflow/press/69162ffa4334ae0267ee1c57_Screenshot_2025-11-13_at_11.22.26_AM-p-1600.png 1600w',
  },
  {
    date: 'September 8, 2024',
    title: 'All Hands AI raises $5M to build open source agents for developers',
    url: 'https://techcrunch.com/2024/09/05/all-hands-ai-raises-5m-to-build-open-source-agents-for-developers',
    image:
      '/assets/webflow/press/6915e88c874e7050ff5b8094_Screenshot_2025-11-13_at_6.09.19_AM.png',
    srcSet:
      '/assets/webflow/blog/6915e88c874e7050ff5b8094_Screenshot_2025-11-13_at_6.09.19_AM-p-500.png 500w, /assets/webflow/blog/6915e88c874e7050ff5b8094_Screenshot_2025-11-13_at_6.09.19_AM-p-800.png 800w, /assets/webflow/blog/6915e88c874e7050ff5b8094_Screenshot_2025-11-13_at_6.09.19_AM-p-1080.png 1080w, /assets/webflow/press/6915e88c874e7050ff5b8094_Screenshot_2025-11-13_at_6.09.19_AM.png 1392w',
  },
] as const;

const buttonBaseStyle: React.CSSProperties = {
  margin: 0,
  textUnderlineOffset: 'auto',
  cursor: 'auto',
};

const overlayLinkStyle: React.CSSProperties = {
  borderStyle: 'none',
  color: 'inherit',
  fontSize: '16px',
  lineHeight: '20.8px',
  maxWidth: '100%',
  textDecoration: 'underline',
  textDecorationThickness: '1.6px',
  textUnderlineOffset: '3px',
};

const Press = () => {
  return (
    <CompanyPageShell layoutPath='/press' backgroundClassName='hidden'>
      <section data-wf-el='section-hero' className='pb-0 pt-0' style={{ position: 'relative' }}>
        <div
          data-wf-el='hero-content'
          className='press-hero-content'
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div data-wf-el='container' className='mx-auto w-[90%] max-w-[1238px]'>
            <div className='flex flex-wrap justify-center' style={{ marginLeft: '-20px', marginRight: '-20px', rowGap: '40px' }}>
              <div className='press-hero-col flex flex-col' style={{ paddingLeft: '20px', paddingRight: '20px', position: 'relative' }}>
                <h1 className='fluid-h1 h1-flow-root text-center text-brand-fg'>
                  In the news
                </h1>
                <p data-wf-el='paragraph-lg' className='press-hero-description fluid-body-lg font-medium text-[#5f5f5f]' style={{ marginTop: '10.4px', marginBottom: '20.8px', textAlign: 'center' }}>
                  Read how OpenHands is reshaping the future of AI-powered software development.
                </p>
                <div data-wf-el='standard-wrap' className='flex justify-center' style={{ alignItems: 'center', marginTop: '49.6px' }}>
                  <div data-wf-el='button' className='btn-wrap-primary relative' style={buttonBaseStyle}>
                    <div data-wf-el='btn-text' aria-hidden='true' style={{ whiteSpace: 'nowrap', cursor: 'auto', textUnderlineOffset: 'auto', pointerEvents: 'none' }}>Contact Us</div>
                    <Link
                      to='/contact'
                      className='absolute inset-0 block bg-transparent'
                      style={overlayLinkStyle}
                      aria-label='Contact Us'
                    >
                      <span className='sr-only'>Contact Us</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section data-wf-el='section' className='press-news-section pt-0' style={{ position: 'relative' }}>
        <div data-wf-el='standard-collection' className='press-standard-collection mx-auto w-[90%] max-w-[1238px]'>
          <div
            data-wf-el='standard-collection-list'
            role='list'
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '24px 0',
              justifyContent: 'center',
              marginLeft: '-12px',
              marginRight: '-12px',
            }}
          >
            {PRESS_ITEMS.map((item) => (
              <div
                key={item.title}
                data-wf-el='standard-collection-list-item'
                role='listitem'
                className='press-card'
                style={{
                  alignContent: 'space-between',
                  alignItems: 'center',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  gridAutoColumns: '1fr',
                  gridTemplateColumns: '1fr',
                  gridTemplateRows: 'auto',
                  justifyContent: 'space-between',
                  paddingLeft: '12px',
                  paddingRight: '12px',
                  position: 'relative',
                }}
              >
                <div data-wf-el='standard-media' style={{ borderRadius: '6.4px', display: 'block', height: '300px', overflow: 'hidden', width: '100%' }}>
                  <img
                    data-wf-el='standard-media-img'
                    src={item.image}
                    srcSet={'srcSet' in item ? item.srcSet : undefined}
                    sizes={'srcSet' in item ? '100vw' : undefined}
                    alt=''
                    className='h-full w-full'
                    style={{ aspectRatio: '3 / 2', borderRadius: '0px', display: 'inline-block', maxWidth: '100%', objectFit: 'fill' }}
                  />
                </div>
                <p className='text-[16px] leading-[22.4px] text-[#5f5f5f]' style={{ margin: '0 0 16px' }}>{item.date}</p>
                <p data-wf-el='paragraph-lg' className='press-card-title fluid-body-lg font-medium text-brand-fg' style={{ margin: '0 0 20.8px', width: '100%' }}>
                  {item.title}
                </p>
                <div data-wf-el='standard-wrap' style={{ display: 'block' }}>
                  <div data-wf-el='button' className='btn-wrap relative' style={buttonBaseStyle}>
                    <div data-wf-el='btn-text' aria-hidden='true' style={{ whiteSpace: 'nowrap', cursor: 'auto', textUnderlineOffset: 'auto', pointerEvents: 'none' }}>Read more</div>
                    <a href={item.url} target='_blank' rel='noopener noreferrer' className='absolute inset-0 block bg-transparent' style={overlayLinkStyle}>
                      <span className='sr-only'>Read more</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </CompanyPageShell>
  );
};

export default Press;
